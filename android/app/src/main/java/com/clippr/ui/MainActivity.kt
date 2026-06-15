package com.clippr.ui

import android.Manifest
import android.content.ClipboardManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.clippr.database.AppDatabase
import com.clippr.database.ClipboardEntry
import com.clippr.databinding.ActivityMainBinding
import com.clippr.model.SyncStatus
import com.clippr.service.ClipboardSyncService
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var adapter: HistoryAdapter
    private var syncService: ClipboardSyncService? = null
    private var serviceBound = false

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

        adapter = HistoryAdapter()
        binding.recyclerHistory.layoutManager = LinearLayoutManager(this)
        binding.recyclerHistory.adapter = adapter

        binding.btnConnect.setOnClickListener {
            startActivity(android.content.Intent(this, ConnectActivity::class.java))
        }

        binding.btnSendToMac.setOnClickListener {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val text = cm.primaryClip?.getItemAt(0)?.text?.toString()
            if (text.isNullOrEmpty()) {
                Toast.makeText(this, "Nothing in clipboard to send", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val si = Intent(this, com.clippr.service.ClipboardSyncService::class.java).apply {
                putExtra("send_text", text)
            }
            startService(si)
            Toast.makeText(this, "✓ Sent to Mac", Toast.LENGTH_SHORT).show()
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
        // Re-bind if ConnectActivity restarted the service and broke our binding
        if (!serviceBound) {
            startAndBindService()
        }
        loadHistory()
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
            binding.tvStatus.text = "Connected to ${status.deviceName}"
            binding.tvStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark))
            binding.statusDot.setBackgroundResource(android.R.drawable.presence_online)
        } else {
            binding.tvStatus.text = "Searching for devices…"
            binding.tvStatus.setTextColor(ContextCompat.getColor(this, android.R.color.darker_gray))
            binding.statusDot.setBackgroundResource(android.R.drawable.presence_away)
        }
    }

    private fun loadHistory() {
        lifecycleScope.launch {
            val items = AppDatabase.getInstance(this@MainActivity).clipboardDao().getAll()
            runOnUiThread { adapter.submitList(items) }
        }
    }

    override fun onDestroy() {
        if (serviceBound) {
            unbindService(connection)
            serviceBound = false
        }
        super.onDestroy()
    }
}
