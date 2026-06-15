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

class HistoryAdapter(
    private val onClick: (ClipboardEntry) -> Unit = {}
) : ListAdapter<ClipboardEntry, HistoryAdapter.VH>(DIFF) {

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
        holder.content.text = item.content
        val time = sdf.format(Date(item.timestamp))
        val source = item.source.ifEmpty { "Unknown" }
        if (item.direction == "received") {
            holder.badge.text = "↓"
            holder.badge.setTextColor(0xFF1259C3.toInt())
        } else {
            holder.badge.text = "↑"
            holder.badge.setTextColor(0xFF00A86B.toInt())
        }
        holder.meta.text = "$source  ·  $time"
        holder.itemView.setOnClickListener { onClick(item) }
    }

    companion object {
        val DIFF = object : DiffUtil.ItemCallback<ClipboardEntry>() {
            override fun areItemsTheSame(a: ClipboardEntry, b: ClipboardEntry) = a.id == b.id
            override fun areContentsTheSame(a: ClipboardEntry, b: ClipboardEntry) = a == b
        }
    }
}
