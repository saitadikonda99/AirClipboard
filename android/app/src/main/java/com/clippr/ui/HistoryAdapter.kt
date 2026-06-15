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
    private val sdf = SimpleDateFormat("h:mm a", Locale.getDefault())

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
        holder.content.text = if (item.content.length > 200) item.content.take(200) + "…" else item.content

        val time = sdf.format(Date(item.timestamp))
        val source = item.source.ifEmpty { "Unknown" }
        holder.meta.text = "$source  ·  $time"

        if (item.direction == "received") {
            holder.badge.text = "↓  From Mac"
            holder.badge.setBackgroundResource(R.drawable.bg_badge_received)
            holder.badge.setTextColor(0xFF0A84FF.toInt())
        } else {
            holder.badge.text = "↑  Sent to Mac"
            holder.badge.setBackgroundResource(R.drawable.bg_badge_sent)
            holder.badge.setTextColor(0xFF34C759.toInt())
        }
    }

    companion object {
        val DIFF = object : DiffUtil.ItemCallback<ClipboardEntry>() {
            override fun areItemsTheSame(a: ClipboardEntry, b: ClipboardEntry) = a.id == b.id
            override fun areContentsTheSame(a: ClipboardEntry, b: ClipboardEntry) = a == b
        }
    }
}
