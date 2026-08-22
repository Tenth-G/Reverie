import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import { sizedImage } from "../utils/image";
import { Album, BookOpenText, CircleUserRound, FileText, Headphones, Link2, Mic2, Music2, Radio } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { useCollectionStore } from "../store/collectionStore";

function vipLabel(vipType?: number): string {
  if (!vipType || vipType === 0) return "普通用户";
  if (vipType === 11) return "黑胶 SVIP";
  if (vipType === 10) return "黑胶 VIP";
  return "VIP 会员";
}

function formatExpire(expireTime?: number): string {
  if (!expireTime || expireTime <= 0) return "—";
  try {
    return new Date(expireTime).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [brokenBadge, setBrokenBadge] = useState("");
  const profile = usePlayerStore((s) => s.profile);
  const vipInfo = usePlayerStore((s) => s.vipInfo);
  const logout = usePlayerStore((s) => s.logout);
  const loadVipInfo = usePlayerStore((s) => s.loadVipInfo);
  const setShowLogin = usePlayerStore((s) => s.setShowLogin);
  const openProfile = useProfileStore((s) => s.openProfile);
  const openCollections = useCollectionStore((s) => s.openCollections);
  const openVip = () =>
    usePlayerStore.setState({ activeView: "vip", prevView: "home" });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (profile && !vipInfo) void loadVipInfo();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, profile, vipInfo, loadVipInfo]);

  const switchAccount = () => {
    setOpen(false);
    setShowLogin(true);
  };

  const vipType = Number(vipInfo?.vipType ?? profile?.vipType ?? 0);
  const vipLevel = Number(vipInfo?.vipLevel ?? 0);
  const expireTime = Number(vipInfo?.expireTime ?? 0);
  const isVip = vipType > 0 || vipLevel > 0 || expireTime > 0;
  const badgeUrl = vipInfo?.badgeUrl || profile?.badgeUrl;

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="topnav-user"
        onClick={() => setOpen(!open)}
        title={profile?.nickname}
      >
        {profile?.avatarUrl ? (
          <img
            className="user-avatar"
            src={sizedImage(profile.avatarUrl, 100)}
            alt=""
          />
        ) : (
          <span className="user-avatar user-avatar-ph">
            <CircleUserRound size={17} />
          </span>
        )}
        <span className="user-nick">{profile?.nickname ?? ""}</span>
        {isVip && badgeUrl && brokenBadge !== badgeUrl ? (
          <img
            className="user-badge-api"
            src={badgeUrl}
            alt="会员"
            onError={() => setBrokenBadge(badgeUrl)}
          />
        ) : isVip ? (
          <span className="user-vip-fallback">
            {vipType === 11 ? "SVIP" : "VIP"}
          </span>
        ) : null}
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-head">
            {profile?.avatarUrl ? (
              <img src={sizedImage(profile.avatarUrl, 100)} alt="" />
            ) : (
              <span className="user-avatar-ph-lg">
                <CircleUserRound size={24} />
              </span>
            )}
            <div className="uh-info">
              <div className="nm">{profile?.nickname}</div>
            </div>
          </div>
          <div className="user-dropdown-row">
            <span>会员类型</span>
            <span>{vipLabel(vipType)}</span>
          </div>
          <div className="user-dropdown-row">
            <span>会员等级</span>
            <span>{vipLevel > 0 ? `Lv.${vipLevel}` : "—"}</span>
          </div>
          <div className="user-dropdown-row">
            <span>会员到期</span>
            <span>{isVip ? formatExpire(expireTime) : "—"}</span>
          </div>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              void openProfile();
            }}
          >
            个人中心
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              void openCollections();
            }}
          >
            收藏中心
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              openVip();
            }}
          >
            会员中心
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              usePlayerStore.setState({
                activeView: "downloadHistory",
                prevView: "home",
              });
            }}
          >
            下载与购买
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              usePlayerStore.setState({
                activeView: "listenTogether",
                prevView: "home",
              });
            }}
          >
            <Link2 size={15} />
            一起听
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              usePlayerStore.setState({
                activeView: "voiceWorkbench",
                prevView: "home",
              });
            }}
          >
            <Mic2 size={15} />
            声音工作台
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              usePlayerStore.setState({
                activeView: "lyricsMark",
                prevView: "home",
              });
            }}
          >
            <BookOpenText size={15} />
            我的歌词本
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              usePlayerStore.setState({
                activeView: "digitalAlbum",
                prevView: "home",
              });
            }}
          >
            <Album size={15} />
            数字专辑
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              usePlayerStore.setState({
                activeView: "musician",
                prevView: "home",
              });
            }}
          >
            <Music2 size={15} />
            音乐人中心
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              usePlayerStore.setState({ activeView: "sati", prevView: "home" });
            }}
          >
            <Headphones size={15} />
            助眠与解压
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              usePlayerStore.setState({ activeView: "broadcast", prevView: "home" });
            }}
          >
            <Radio size={15} />
            广播电台
          </button>
          <button className="user-dropdown-item" onClick={() => { setOpen(false); usePlayerStore.setState({ activeView: "ugc", prevView: "home" }); }}>
            <FileText size={15} />百科贡献
          </button>
          <button className="user-dropdown-item" onClick={switchAccount}>
            切换账号
          </button>
          <button
            className="user-dropdown-item danger"
            onClick={() => {
              logout();
              setOpen(false);
            }}
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
