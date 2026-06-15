package com.clippr.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.clippr.databinding.ActivityConnectBinding
import com.clippr.service.ClipboardSyncService
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

class ConnectActivity : AppCompatActivity() {
    private lateinit var binding: ActivityConnectBinding

    private val scanLauncher = registerForActivityResult(ScanContract()) { result ->
        val content = result.contents ?: return@registerForActivityResult
        // Parse airclipboard://ip:port
        val raw = content.removePrefix("airclipboard://")
        val parts = raw.split(":")
        val ip = parts.getOrNull(0) ?: raw
        val port = parts.getOrNull(1) ?: "8585"
        binding.etIp.setText(ip)
        binding.etPort.setText(port)
        Toast.makeText(this, "QR scanned — tap Connect", Toast.LENGTH_SHORT).show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityConnectBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Pre-fill if passed from intent
        intent.getStringExtra("ip")?.let { binding.etIp.setText(it) }
        intent.getStringExtra("port")?.let { binding.etPort.setText(it) }
        if (binding.etPort.text.isNullOrEmpty()) binding.etPort.setText("8585")

        binding.btnScanQr.setOnClickListener {
            scanLauncher.launch(ScanOptions().apply {
                setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                setPrompt("Scan the QR code shown in AirClipboard on your Mac")
                setBeepEnabled(false)
                setOrientationLocked(false)
            })
        }

        binding.btnConnect.setOnClickListener {
            val ip = binding.etIp.text.toString().trim()
            val port = binding.etPort.text.toString().trim().toIntOrNull() ?: 8585
            if (ip.isEmpty()) {
                Toast.makeText(this, "Enter the Mac's IP address", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            getSharedPreferences("clippr_connect", MODE_PRIVATE).edit()
                .putString("manual_ip", ip)
                .putInt("manual_port", port)
                .apply()

            Toast.makeText(this, "Connecting to $ip:$port…", Toast.LENGTH_SHORT).show()
            // Restart service so onStartCommand picks up the new IP
            stopService(Intent(this, ClipboardSyncService::class.java))
            startService(Intent(this, ClipboardSyncService::class.java))
            finish()
        }

        binding.btnBack.setOnClickListener { finish() }
        // Also support the toolbar back gesture
        onBackPressedDispatcher.addCallback(this, object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { finish() }
        })
    }
}
