package com.clippr.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.clippr.service.ClipboardSyncService

// Share target — lets users share text from any app directly to Mac
class ShareActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            val text = intent.getStringExtra(Intent.EXTRA_TEXT)
            if (!text.isNullOrEmpty()) {
                val si = Intent(this, ClipboardSyncService::class.java).apply {
                    putExtra("send_text", text)
                }
                startService(si)
                Toast.makeText(this, "Sent to Mac", Toast.LENGTH_SHORT).show()
            }
        }
        finish()
    }
}
