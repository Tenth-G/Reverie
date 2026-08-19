import { useCallback, useEffect, useRef, useState } from 'react'
import { qrCheck, qrCreate, qrKey } from '../api/client'
import { usePlayerStore } from '../store/playerStore'
import { IconRefresh } from './icons'

type QrState = 'loading' | 'waiting' | 'scanned' | 'expired' | 'success' | 'error'

export default function LoginModal() {
  const showLogin = usePlayerStore((s) => s.showLogin)
  const setShowLogin = usePlayerStore((s) => s.setShowLogin)
  const applyLogin = usePlayerStore((s) => s.applyLogin)
  const toast = usePlayerStore((s) => s.toast)

  const [qrimg, setQrimg] = useState('')
  const [qrurl, setQrurl] = useState('')
  const [status, setStatus] = useState<QrState>('loading')
  const keyRef = useRef('')
  const timerRef = useRef<number | null>(null)
  const aliveRef = useRef(true)

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startQr = useCallback(async () => {
    setStatus('loading')
    try {
      const key = await qrKey()
      keyRef.current = key
      const { qrimg: img, qrurl: url } = await qrCreate(key)
      setQrimg(img)
      setQrurl(url)
      setStatus('waiting')
    } catch {
      setStatus('error')
      toast('获取二维码失败，请检查网络', 'error')
    }
  }, [toast])

  const poll = useCallback(async () => {
    if (!keyRef.current) return
    try {
      const res = await qrCheck(keyRef.current)
      const code = res.code
      if (code === 803) {
        stopPolling()
        setStatus('success')
        const ok = await applyLogin(res.cookie ?? '')
        if (ok) {
          toast('登录成功', 'success')
          setTimeout(() => setShowLogin(false), 600)
        } else {
          setStatus('error')
          toast('登录信息校验失败，请重试', 'error')
        }
      } else if (code === 800) {
        setStatus('expired')
        // auto-refresh
        setTimeout(() => startQr(), 1200)
      } else if (code === 802) {
        setStatus('scanned')
      } else if (code === 801) {
        setStatus('waiting')
      }
    } catch {
      /* transient network error: keep polling */
    }
  }, [applyLogin, startQr, toast, setShowLogin])

  useEffect(() => {
    if (showLogin) {
      aliveRef.current = true
      startQr()
      timerRef.current = window.setInterval(() => {
        if (aliveRef.current) poll()
      }, 2200)
    } else {
      stopPolling()
    }
    return () => {
      aliveRef.current = false
      stopPolling()
    }
  }, [showLogin, poll, startQr])

  if (!showLogin) return null

  const statusText: Record<QrState, string> = {
    loading: '正在生成二维码…',
    waiting: '请使用网易云音乐 App 扫码登录',
    scanned: '已扫码，请在手机上确认登录',
    expired: '二维码已过期，正在刷新…',
    success: '登录成功！',
    error: '获取二维码失败，请点击下方重试',
  }

  return (
    <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>扫码登录</h2>
        <p className="sub">使用「网易云音乐」手机 App 扫描二维码完成登录，畅享高品质音乐与每日推荐</p>
        <div className="qr-box">
          {qrimg ? (
            <img
              src={qrimg}
              alt="登录二维码"
              style={{ opacity: status === 'expired' || status === 'error' ? 0.4 : 1 }}
            />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: 12,
                background: 'var(--bg-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-faint)',
              }}
            >
              {status === 'error' ? '二维码加载失败' : '加载中…'}
            </div>
          )}
          <div className={`qr-status ${status === 'success' ? 'ok' : ''}`}>
            {statusText[status]}
          </div>
          {(status === 'error' || status === 'expired') && (
            <button className="btn" onClick={startQr}>
              <IconRefresh width={15} height={15} /> 刷新二维码
            </button>
          )}
          {qrurl && (
            <a
              href={qrurl}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent-2)', fontSize: 12 }}
              onClick={(e) => {
                // open in external browser via window.open handler in main
                window.open(qrurl, '_blank')
                e.preventDefault()
              }}
            >
              无法扫码？点此在浏览器中打开
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
