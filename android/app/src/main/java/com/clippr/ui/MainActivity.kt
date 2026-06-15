package com.clippr.ui

import android.Manifest
import android.content.ClipboardManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.clippr.R
import com.clippr.database.AppDatabase
import com.clippr.databinding.ActivityMainBinding
import com.clippr.model.SyncStatus
import com.clippr.service.ClipboardSyncService
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var adapter: HistoryAdapter
    private var syncService: ClipboardSyncService? = null
    private var serviceBound = false
    private var activeTab = "history"

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, binder: IBinder) {
            val b = binder as ClipboardSyncService.LocalBinder
            syncService = b.getService()
            serviceBound = true
            updateStatus(b.getService().currentStatus)
            b.getService().statusCallback = { status -> runOnUiThread { updateStatus(status) } }
            b.getService().historyCallback = { loadHistory() }
        }
        override fun onServiceDisconnected(name: ComponentName) {
            serviceBound = false
            syncService = null
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        adapter = HistoryAdapter { item ->
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = android.content.ClipData.newPlainText("AirClipboard", item.content)
            cm.setPrimaryClip(clip)
            Toast.makeText(this, "Copied!", Toast.LENGTH_SHORT).show()
        }
        binding.recyclerHistory.layoutManager = LinearLayoutManager(this)
        binding.recyclerHistory.adapter = adapter

        // Tab switching
        binding.tabHistory.setOnClickListener { switchTab("history") }
        binding.tabConnect.setOnClickListener { switchTab("connect") }

        // Connect tab: scan QR
        binding.btnScanQr.setOnClickListener {
            startActivity(Intent(this, ConnectActivity::class.java))
        }

        // Connect tab: connect button
        binding.btnConnect.setOnClickListener {
            val ip = binding.etIp.text.toString().trim()
            val port = binding.etPort.text.toString().trim().toIntOrNull() ?: 8585
            if (ip.isEmpty()) {
                Toast.makeText(this, "Enter an IP address", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val prefs = getSharedPreferences("clippr_connect", MODE_PRIVATE)
            prefs.edit().putString("manual_ip", ip).putInt("manual_port", port).apply()
            stopService(Intent(this, ClipboardSyncService::class.java))
            startAndBindService()
            switchTab("history")
            Toast.makeText(this, "Connecting to $ip…", Toast.LENGTH_SHORT).show()
        }

        binding.btnSendToMac.setOnClickListener {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val text = cm.primaryClip?.getItemAt(0)?.text?.toString()
            if (text.isNullOrEmpty()) {
                Toast.makeText(this, "Nothing in clipboard to send", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val si = Intent(this, ClipboardSyncService::class.java).apply {
                putExtra("send_text", text)
            }
            startService(si)
            Toast.makeText(this, "Sent to Mac", Toast.LENGTH_SHORT).show()
        }

        binding.btnClearHistory.setOnClickListener {
            lifecycleScope.launch {
                AppDatabase.getInstance(this@MainActivity).clipboardDao().clearAll()
                loadHistory()
            }
        }

        requestPermissionsIfNeeded()
        startAndBindService()
        loadHistory()
    }

    override fun onResume() {
        super.onResume()
        if (!serviceBound) startAndBindService()
        loadHistory()
    }

    private fun switchTab(tab: String) {
        activeTab = tab
        if (tab == "history") {
            binding.panelHistory.visibility = View.VISIBLE
            binding.panelConnect.visibility = View.GONE
            binding.tabHistory.setTextColor(0xFFFFFFFF.toInt())
            binding.tabHistory.setTypeface(null, Typeface.BOLD)
            binding.tabHistory.setBackgroundResource(R.drawable.bg_tab_active)
            binding.tabConnect.setTextColor(0xAAFFFFFF.toInt())
            binding.tabConnect.setTypeface(null, Typeface.BOLD)
            binding.tabConnect.setBackgroundColor(android.graphics.Color.TRANSPARENT)
        } else {
            binding.panelHistory.visibility = View.GONE
            binding.panelConnect.visibility = View.VISIBLE
            binding.tabHistory.setTextColor(0xAAFFFFFF.toInt())
            binding.tabHistory.setTypeface(null, Typeface.BOLD)
            binding.tabHistory.setBackgroundColor(android.graphics.Color.TRANSPARENT)
            binding.tabConnect.setTextColor(0xFFFFFFFF.toInt())
            binding.tabConnect.setTypeface(null, Typeface.BOLD)
            binding.tabConnect.setBackgroundResource(R.drawable.bg_tab_active)
        }
    }

    private fun requestPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 100)
            }
        }
    }

    private fun startAndBindService() {
        val intent = Intent(this, ClipboardSyncService::class.java)
        ContextCompat.startForegroundService(this, intent)
        bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    private fun updateStatus(status: SyncStatus) {
        if (status.connected) {
            binding.tvStatus.text = "Online"
            binding.tvDeviceName.text = "Connected to ${status.deviceName}"
            binding.statusDot.setBackgroundResource(R.drawable.bg_dot_on)
        } else {
            binding.tvStatus.text = "Offline"
            binding.tvDeviceName.text = "Not connected to any device"
            binding.statusDot.setBackgroundResource(R.drawable.bg_dot_off)
        }
    }

    private fun loadHistory() {
        lifecycleScope.launch {
            val items = AppDatabase.getInstance(this@MainActivity).clipboardDao().getAll()
            runOnUiThread {
                adapter.submitList(items)
                binding.tvEmpty.visibility = if (items.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    override fun onDestroy() {
        if (serviceBound) { unbindService(connection); serviceBound = false }
        super.onDestroy()
    }
}
