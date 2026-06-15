package com.clippr.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.clippr.databinding.ActivityConnectBinding
import com.clippr.service.ClipboardSyncService

class ConnectActivity : AppCompatActivity() {
    private lateinit var binding: ActivityConnectBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityConnectBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Pre-fill if passed from QR
        intent.getStringExtra("ip")?.let { binding.etIp.setText(it) }
        intent.getStringExtra("port")?.let { binding.etPort.setText(it) }
        if (binding.etPort.text.isNullOrEmpty()) binding.etPort.setText("8585")

        binding.btnConnect.setOnClickListener {
            val ip = binding.etIp.text.toString().trim()
            val port = binding.etPort.text.toString().trim().toIntOrNull() ?: 8585
            if (ip.isEmpty()) {
                Toast.makeText(this, "Enter the Mac's IP address", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            // Pass manual IP to the service via shared pref
            getSharedPreferences("clippr_connect", MODE_PRIVATE).edit()
                .putString("manual_ip", ip)
                .putInt("manual_port", port)
                .apply()

            Toast.makeText(this, "Connecting to $ip:$port…", Toast.LENGTH_SHORT).show()
            startService(Intent(this, ClipboardSyncService::class.java))
            finish()
        }

        binding.btnBack.setOnClickListener { finish() }
    }
}
