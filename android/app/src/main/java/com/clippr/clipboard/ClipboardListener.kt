package com.clippr.clipboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context

class ClipboardListener(private val context: Context) {
    private val manager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    private var onChange: ((String) -> Unit)? = null
    private var lastText = ""

    private val listener = ClipboardManager.OnPrimaryClipChangedListener {
        val text = manager.primaryClip?.getItemAt(0)?.text?.toString() ?: return@OnPrimaryClipChangedListener
        if (text.isNotEmpty() && text != lastText) {
            lastText = text
            onChange?.invoke(text)
        }
    }

    fun start(onChanged: (String) -> Unit) {
        onChange = onChanged
        manager.addPrimaryClipChangedListener(listener)
    }

    fun stop() {
        manager.removePrimaryClipChangedListener(listener)
        onChange = null
    }

    fun setClipboard(text: String) {
        lastText = text
        val clip = ClipData.newPlainText("Clippr", text)
        manager.setPrimaryClip(clip)
    }

    fun setLastKnown(text: String) { lastText = text }
}
