package com.clippr.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.clippr.R
import com.clippr.database.ClipboardEntry
import java.text.SimpleDateFormat
import java.util.*

class HistoryAdapter : ListAdapter<ClipboardEntry, HistoryAdapter.VH>(DIFF) {
    private val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    inner class VH(v: View) : RecyclerView.ViewHolder(v) {
        val content: TextView = v.findViewById(R.id.tv_content)
        val meta: TextView = v.findViewById(R.id.tv_meta)
        val badge: TextView = v.findViewById(R.id.tv_badge)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.item_history, parent, false)
        return VH(v)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = getItem(position)
        holder.content.text = if (item.content.length > 120) item.content.take(120) + "…" else item.content
        holder.meta.text = "${item.source}  •  ${sdf.format(Date(item.timestamp))}"
        holder.badge.text = if (item.direction == "received") "↓" else "↑"
        holder.badge.setBackgroundColor(
            if (item.direction == "received") 0xFFE3F2FD.toInt() else 0xFFE8F5E9.toInt()
        )
        holder.badge.setTextColor(
            if (item.direction == "received") 0xFF1976D2.toInt() else 0xFF388E3C.toInt()
        )
    }

    companion object {
        val DIFF = object : DiffUtil.ItemCallback<ClipboardEntry>() {
            override fun areItemsTheSame(a: ClipboardEntry, b: ClipboardEntry) = a.id == b.id
            override fun areContentsTheSame(a: ClipboardEntry, b: ClipboardEntry) = a == b
        }
    }
}
