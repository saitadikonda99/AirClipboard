package com.clippr.service

import android.app.*
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.clippr.R
import com.clippr.clipboard.ClipboardListener
import com.clippr.database.AppDatabase
import com.clippr.database.ClipboardEntry
import com.clippr.discovery.ClipprNSDManager
import com.clippr.model.ClipprMessage
import com.clippr.model.DeviceInfo
import com.clippr.model.MsgType
import com.clippr.model.SyncStatus
import com.clippr.pairing.PairingManager
import com.clippr.security.CryptoManager
import com.clippr.ui.MainActivity
import com.clippr.websocket.ClipprWebSocketClient
import kotlinx.coroutines.*
import java.util.UUID

class ClipboardSyncService : Service() {
    private val binder = LocalBinder()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    lateinit var pairingManager: PairingManager
    private lateinit var clipboardListener: ClipboardListener
    private lateinit var nsdManager: ClipprNSDManager
    private lateinit var db: AppDatabase

    private var wsClient: ClipprWebSocketClient? = null
    private val triedHosts = mutableSetOf<String>()
    private var clipboardListenerStarted = false

    var statusCallback: ((SyncStatus) -> Unit)? = null
    var historyCallback: (() -> Unit)? = null

    var currentStatus = SyncStatus()
        private set

    companion object {
        const val CHANNEL_ID = "clippr_sync"
        const val RECV_CHANNEL_ID = "clippr_recv"
        const val NOTIF_ID = 1
        private const val TAG = "ClipprService"
    }

    inner class LocalBinder : Binder() {
        fun getService(): ClipboardSyncService = this@ClipboardSyncService
    }

    override fun onCreate() {
        super.onCreate()
        pairingManager = PairingManager(this)
        clipboardListener = ClipboardListener(this)
        nsdManager = ClipprNSDManager(this)
        db = AppDatabase.getInstance(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Handle text sent from ShareActivity — don't restart the connection
        val sendText = intent?.getStringExtra("send_text")
        if (!sendText.isNullOrEmpty()) {
            scope.launch {
                val client = wsClient ?: return@launch
                if (!client.isConnected()) return@launch
                client.sendClipboard(sendText)
                db.clipboardDao().insert(
                    ClipboardEntry(
                        id = UUID.randomUUID().toString(),
                        content = sendText,
                        timestamp = System.currentTimeMillis(),
                        source = pairingManager.getMyDeviceName(),
                        direction = "sent"
                    )
                )
                withContext(Dispatchers.Main) { historyCallback?.invoke() }
            }
            return START_STICKY
        }

        startForeground(NOTIF_ID, buildNotification("Searching for devices…"))

        // Disconnect any existing client and reset state
        wsClient?.disconnect()
        wsClient = null
        triedHosts.clear()
        nsdManager.stopDiscovery()
        updateStatus(SyncStatus(false))

        val prefs = getSharedPreferences("clippr_connect", MODE_PRIVATE)
        val manualIp = prefs.getString("manual_ip", null)
        val manualPort = prefs.getInt("manual_port", 8585)

        if (!manualIp.isNullOrEmpty()) {
            Log.d(TAG, "Connecting to manual IP: $manualIp:$manualPort")
            triedHosts.add(manualIp) // prevent NSD from double-connecting same host
            connectTo(manualIp, manualPort)
        }

        startDiscovery()

        if (!clipboardListenerStarted) {
            startClipboardListener()
            clipboardListenerStarted = true
        }

        return START_STICKY
    }

    private fun startDiscovery() {
        nsdManager.startDiscovery { host, port ->
            if (triedHosts.contains(host)) return@startDiscovery
            triedHosts.add(host)
            connectTo(host, port)
        }
    }

    private fun connectTo(host: String, port: Int) {
        val myId = pairingManager.getMyDeviceId()
        val myName = pairingManager.getMyDeviceName()

        val client = ClipprWebSocketClient(
            deviceId = myId,
            deviceName = myName,
            onConnected = { Log.d(TAG, "WS connected to $host:$port") },
            onDisconnected = {
                Log.d(TAG, "WS disconnected from $host:$port")
                triedHosts.remove(host)
                updateStatus(SyncStatus(false))
                updateNotification("Searching for devices…")
            },
            onMessage = { msg -> handleMessage(msg) }
        )

        wsClient = client
        client.connect(host, port)
    }

    private fun handleMessage(msg: ClipprMessage) {
        when (msg.type) {
            MsgType.PAIR_ACCEPT -> {
                val device = DeviceInfo(
                    deviceId = msg.deviceId,
                    deviceName = msg.deviceName,
                    sharedKey = msg.sharedKey,
                    pairedAt = System.currentTimeMillis()
                )
                pairingManager.trustDevice(device)
                wsClient?.sharedKey = msg.sharedKey
                updateStatus(SyncStatus(true, msg.deviceName, msg.deviceId))
                updateNotification("Connected to ${msg.deviceName}")
            }
            MsgType.PAIR_REJECT -> {
                Log.d(TAG, "Pair rejected")
                wsClient?.disconnect()
                wsClient = null
                updateStatus(SyncStatus(false))
            }
            MsgType.CLIPBOARD -> {
                val key = wsClient?.sharedKey ?: return
                try {
                    val text = CryptoManager.decrypt(msg.payload, key)
                    if (msg.source == pairingManager.getMyDeviceId()) return
                    // Try direct set (works on Android <10 or when app is foreground)
                    try { clipboardListener.setClipboard(text) } catch (_: Exception) {}
                    // Always show notification so user can copy on Android 10+/12+
                    showReceivedNotification(text)
                    scope.launch {
                        db.clipboardDao().insert(
                            ClipboardEntry(
                                id = msg.id.ifEmpty { UUID.randomUUID().toString() },
                                content = text,
                                timestamp = msg.timestamp.takeIf { it > 0 } ?: System.currentTimeMillis(),
                                source = currentStatus.deviceName,
                                direction = "received"
                            )
                        )
                        withContext(Dispatchers.Main) { historyCallback?.invoke() }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Decrypt error: ${e.message}")
                }
            }
            MsgType.PING -> { }
        }
    }

    private fun startClipboardListener() {
        clipboardListener.start { text ->
            val client = wsClient ?: return@start
            if (!client.isConnected()) return@start
            client.sendClipboard(text)
            scope.launch {
                db.clipboardDao().insert(
                    ClipboardEntry(
                        id = UUID.randomUUID().toString(),
                        content = text,
                        timestamp = System.currentTimeMillis(),
                        source = pairingManager.getMyDeviceName(),
                        direction = "sent"
                    )
                )
                withContext(Dispatchers.Main) { historyCallback?.invoke() }
            }
        }
    }

    private fun updateStatus(status: SyncStatus) {
        currentStatus = status
        statusCallback?.invoke(status)
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIF_ID, buildNotification(text))
    }

    private fun buildNotification(text: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pi = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AirClipboard")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_share)
            .setContentIntent(pi)
            .setOngoing(true)
            .build()
    }

    private fun showReceivedNotification(text: String) {
        val preview = if (text.length > 80) text.take(80) + "…" else text
        val copyIntent = android.content.Intent(this, com.clippr.ui.CopyToClipboardActivity::class.java).apply {
            putExtra("text", text)
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val copyPi = android.app.PendingIntent.getActivity(
            this, System.currentTimeMillis().toInt(), copyIntent,
            android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
        )
        val notif = NotificationCompat.Builder(this, RECV_CHANNEL_ID)
            .setContentTitle("Clipboard from Mac")
            .setContentText(preview)
            .setStyle(NotificationCompat.BigTextStyle().bigText(preview))
            .setSmallIcon(android.R.drawable.ic_menu_share)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .addAction(android.R.drawable.ic_menu_edit, "Tap to Copy", copyPi)
            .setContentIntent(copyPi)
            .setAutoCancel(true)
            .build()
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
            .notify(System.currentTimeMillis().toInt(), notif)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Clipboard Sync", NotificationManager.IMPORTANCE_LOW)
            )
            nm.createNotificationChannel(
                NotificationChannel(RECV_CHANNEL_ID, "Received Clipboard", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Shown when Mac sends clipboard content"
                }
            )
        }
    }

    override fun onBind(intent: Intent): IBinder = binder

    override fun onDestroy() {
        scope.cancel()
        clipboardListener.stop()
        nsdManager.stopDiscovery()
        wsClient?.disconnect()
        super.onDestroy()
    }
}
