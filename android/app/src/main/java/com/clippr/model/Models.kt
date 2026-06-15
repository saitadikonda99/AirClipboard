package com.clippr.model

data class ClipprMessage(
    val type: String,
    val id: String = "",
    val source: String = "",
    val timestamp: Long = 0L,
    val mimeType: String = "text/plain",
    val payload: String = "",
    val deviceId: String = "",
    val deviceName: String = "",
    val sharedKey: String = "",
    val code: String = ""
)

data class DeviceInfo(
    val deviceId: String,
    val deviceName: String,
    val sharedKey: String = "",
    val pairedAt: Long = 0L
)

data class SyncStatus(
    val connected: Boolean = false,
    val deviceName: String = "",
    val deviceId: String = ""
)

object MsgType {
    const val CLIPBOARD = "clipboard"
    const val PAIR_REQUEST = "pair_request"
    const val PAIR_ACCEPT = "pair_accept"
    const val PAIR_REJECT = "pair_reject"
    const val PING = "ping"
    const val PONG = "pong"
}
