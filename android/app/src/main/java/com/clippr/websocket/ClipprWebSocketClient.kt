package com.clippr.websocket

import android.util.Log
import com.clippr.model.ClipprMessage
import com.clippr.model.MsgType
import com.clippr.security.CryptoManager
import com.google.gson.Gson
import okhttp3.*
import java.util.concurrent.TimeUnit

class ClipprWebSocketClient(
    private val deviceId: String,
    private val deviceName: String,
    private val onMessage: (ClipprMessage) -> Unit,
    private val onConnected: () -> Unit,
    private val onDisconnected: () -> Unit
) {
    private val gson = Gson()
    private var ws: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .pingInterval(30, TimeUnit.SECONDS)
        .connectTimeout(10, TimeUnit.SECONDS)
        .build()

    var sharedKey: String? = null
    var lastClipboard: String = ""

    companion object { private const val TAG = "ClipprWS" }

    fun connect(host: String, port: Int) {
        val url = "ws://$host:$port"
        Log.d(TAG, "Connecting to $url")
        val request = Request.Builder().url(url).build()
        ws = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "Connected")
                onConnected()
                sendPairRequest(webSocket)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val msg = gson.fromJson(text, ClipprMessage::class.java)
                    onMessage(msg)
                } catch (e: Exception) {
                    Log.e(TAG, "Parse error: ${e.message}")
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "Closed: $reason")
                onDisconnected()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WS failure: ${t.message}")
                onDisconnected()
            }
        })
    }

    private fun sendPairRequest(webSocket: WebSocket) {
        val msg = ClipprMessage(type = MsgType.PAIR_REQUEST, deviceId = deviceId, deviceName = deviceName)
        webSocket.send(gson.toJson(msg))
    }

    fun sendClipboard(text: String) {
        val key = sharedKey ?: return
        if (ws == null) return
        try {
            val encrypted = CryptoManager.encrypt(text, key)
            val msg = ClipprMessage(
                type = MsgType.CLIPBOARD,
                id = java.util.UUID.randomUUID().toString(),
                source = deviceId,
                timestamp = System.currentTimeMillis(),
                mimeType = "text/plain",
                payload = encrypted
            )
            ws?.send(gson.toJson(msg))
            lastClipboard = text
        } catch (e: Exception) {
            Log.e(TAG, "Encrypt/send error: ${e.message}")
        }
    }

    fun disconnect() {
        ws?.close(1000, "User disconnect")
        ws = null
    }

    fun isConnected() = ws != null
}
