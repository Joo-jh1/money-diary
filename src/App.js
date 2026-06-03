import { useState, useRef, useEffect, useCallback } from "react";

const CATEGORIES = [
  { id: "food",   label: "먹거리",   emoji: "🍕", color: "#FF6B6B" },
  { id: "fun",    label: "놀이",    emoji: "🎮", color: "#4ECDC4" },
  { id: "school", label: "학용품",   emoji: "📚", color: "#45B7D1" },
  { id: "gift",   label: "선물",    emoji: "🎁", color: "#F7A440" },
  { id: "saving", label: "저축",    emoji: "🐷", color: "#A29BFE" },
  { id: "etc",    label: "기타",    emoji: "✨", color: "#BB8FCE" },
];
const STICKERS = ["😋","🎉","💸","🛍️","💝","🌟","🎈","🍦","🎨","🏆","🐷","🌈"];
const CAT = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

const LS = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch { if (k === "yd_posts" && Array.isArray(v)) { try { localStorage.setItem(k, JSON.stringify(v.map(p => ({...p, imageUrl: null})))); } catch {} } }
  },
};

const CLOUD_NAME = "ddmiwwbu4";
const UPLOAD_PRESET = "yongdon_upload";

function compressImage(dataUrl, maxW = 1200, q = 0.85) {
  return new Promise(resolve => {
    if (!dataUrl) { resolve(null); return; }
    const img = new window.Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", q));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function uploadToCloudinary(dataUrl) {
  if (!dataUrl) return null;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const fd = new FormData();
    fd.append("file", blob); fd.append("upload_preset", UPLOAD_PRESET); fd.append("folder", "yongdon");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:"POST", body:fd });
    const data = await res.json();
    return data.secure_url || null;
  } catch { return dataUrl; }
}

const won  = (n) => n < 0 ? "-" + Number(Math.abs(n)).toLocaleString("ko-KR") + "원" : Number(n || 0).toLocaleString("ko-KR") + "원";
const fmtD = (d) => new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
const thisMonth = (d) => { const n = new Date(), t = new Date(d); return n.getFullYear() === t.getFullYear() && n.getMonth() === t.getMonth(); };
const KR_MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap');
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  button{-webkit-user-select:none;user-select:none;touch-action:manipulation;}
  html,body{margin:0;background:#f4f4f8;overflow-x:hidden;max-width:100%;overscroll-behavior:none;}
  *{touch-action:pan-y;}
  button,input,textarea,select{touch-action:manipulation;}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes modalUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes heartPop{0%{opacity:1;transform:translate(-50%,-50%) scale(.4)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.6)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
`;

function encodeData(obj) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); } catch { return null; }
}
function decodeData(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
}

// ════════════════════════════════════════════════════════════
// 통계 공유 화면 (읽기 전용)
// ════════════════════════════════════════════════════════════
function StatsShareView({ data }) {
  const { nickname, year, month, totalInc, totalExp, cashExp, cardExp, categoryStats, records } = data;
  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"#f4f4f8", fontFamily:"'Noto Sans KR',sans-serif" }}>
      <style>{G}</style>
      <div style={{ background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", padding:"24px 20px 20px", color:"white", textAlign:"center" }}>
        <div style={{ fontSize:13, fontWeight:700, opacity:.8, marginBottom:6 }}>📊 용돈일기 통계 공유</div>
        <div style={{ fontSize:22, fontWeight:900 }}>{nickname}의 {year !== new Date().getFullYear() ? `${year}년 ` : ""}{KR_MONTHS[month-1]} 리포트</div>
        <div style={{ fontSize:13, opacity:.8, marginTop:4 }}>💰 용돈일기 앱</div>
      </div>

      <div style={{ padding:"16px 14px 40px" }}>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <div style={{ flex:1, background:"linear-gradient(135deg,#E8F5E9,#F1F8E9)", borderRadius:20, padding:"16px 18px", border:"2px solid #C8E6C9" }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#66BB6A", marginBottom:4 }}>{month}월 수입</div>
            <div style={{ fontSize:22, fontWeight:900, color:"#2E7D32" }}>+{won(totalInc)}</div>
          </div>
          <div style={{ flex:1, background:"linear-gradient(135deg,#FFF3F3,#FFF8F8)", borderRadius:20, padding:"16px 18px", border:"2px solid #FFCDD2" }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#FF6B6B", marginBottom:4 }}>{month}월 지출</div>
            <div style={{ fontSize:22, fontWeight:900, color:"#FF6B6B" }}>-{won(totalExp)}</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <div style={{ flex:1, background:"white", borderRadius:20, padding:"14px 16px", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#aaa", marginBottom:4 }}>💵 현금 지출</div>
            <div style={{ fontSize:18, fontWeight:900, color:"#FF6B6B" }}>-{won(cashExp)}</div>
          </div>
          <div style={{ flex:1, background:"white", borderRadius:20, padding:"14px 16px", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#aaa", marginBottom:4 }}>💳 카드 지출</div>
            <div style={{ fontSize:18, fontWeight:900, color:"#45B7D1" }}>-{won(cardExp)}</div>
          </div>
        </div>

        <div style={{ background:"white", borderRadius:22, padding:22, marginBottom:14, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
          <h3 style={{ margin:"0 0 16px", fontWeight:900, fontSize:15, color:"#1a1a2e" }}>📊 카테고리별 지출</h3>
          {categoryStats.length === 0
            ? <div style={{ textAlign:"center", color:"#ddd", padding:"16px 0" }}>지출 내역이 없어요</div>
            : categoryStats.map(s => {
                const pct = totalExp > 0 ? (s.amount / totalExp * 100) : 0;
                const c = CAT(s.id);
                return (
                  <div key={s.id} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:700 }}>{c.emoji} {c.label}</span>
                      <span style={{ fontSize:13, fontWeight:900, color:c.color }}>{won(s.amount)}</span>
                    </div>
                    <div style={{ height:10, background:"#f4f4f8", borderRadius:8, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${c.color},${c.color}88)`, borderRadius:8 }} />
                    </div>
                    <div style={{ fontSize:11, color:"#ccc", marginTop:2 }}>{Math.round(pct)}%</div>
                  </div>
                );
              })
          }
        </div>

        <div style={{ background:"white", borderRadius:22, padding:22, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
          <h3 style={{ margin:"0 0 16px", fontWeight:900, fontSize:15, color:"#1a1a2e" }}>🕐 {month}월 전체 기록</h3>
          {records.length === 0
            ? <div style={{ textAlign:"center", color:"#ddd", padding:"16px 0" }}>기록이 없어요</div>
            : records.map((r, i) => {
                const isInc = r.type === "income";
                const c = isInc ? { color:"#66BB6A", emoji:"💵", label:"수입" } : CAT(r.category);
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, paddingBottom:14, borderBottom:"1px solid #f8f8f8" }}>
                    <div style={{ width:44, height:44, borderRadius:14, background: isInc ? "#E8F5E9" : `${c.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{r.sticker || c.emoji}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.memo || "기록 없음"}</div>
                      <div style={{ fontSize:11, color:"#bbb", marginTop:2 }}>{fmtD(r.date)} · {c.label}</div>
                    </div>
                    <div style={{ fontWeight:900, color: isInc ? "#2E7D32" : c.color, fontSize:14, flexShrink:0 }}>{isInc ? "+" : "-"}{won(r.amount)}</div>
                  </div>
                );
              })
          }
        </div>

        <div style={{ textAlign:"center", padding:"20px 0 10px", fontSize:12, color:"#ccc" }}>💰 용돈일기 앱으로 나도 기록해보기</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 온보딩
// ════════════════════════════════════════════════════════════
function Onboarding({ onDone }) {
  const [nick, setNick] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef(); const galleryRef = useRef();
  const handleFile = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async ev => { const c = await compressImage(ev.target.result, 400, 0.85); setAvatar(c); const u = await uploadToCloudinary(c); if (u) setAvatar(u); };
    r.readAsDataURL(f);
  };
  const submit = () => { if (!nick.trim()) return; onDone({ nickname: nick.trim(), bio: bio.trim(), avatarUrl: avatar, createdAt: new Date().toISOString() }); };
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#FF6B6B 0%,#FF8E53 40%,#FFD93D 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{G}</style>
      <div style={{ width:"100%", maxWidth:400, background:"white", borderRadius:32, padding:"36px 28px 32px", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", animation:"slideUp .5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>💰</div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:"#1a1a2e" }}>용돈일기</h1>
          <p style={{ margin:"8px 0 0", color:"#aaa", fontSize:14 }}>나만의 소비 피드를 만들어봐요!</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24, gap:12 }}>
          <div style={{ width:90, height:90, borderRadius:"50%", background: avatar ? "transparent" : "linear-gradient(135deg,#FF6B6B,#FF8E53)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", boxShadow:"0 4px 16px rgba(255,107,107,0.35)" }}>
            {avatar ? <img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:36 }}>🐰</span>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => fileRef.current.click()} style={{ padding:"7px 16px", borderRadius:20, border:"2px solid #FF6B6B", background:"white", color:"#FF6B6B", fontSize:13, fontWeight:700, cursor:"pointer" }}>카메라</button>
            <button onClick={() => galleryRef.current.click()} style={{ padding:"7px 16px", borderRadius:20, border:"2px solid #FF6B6B", background:"white", color:"#FF6B6B", fontSize:13, fontWeight:700, cursor:"pointer" }}>앨범</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handleFile} style={{ display:"none" }} />
          <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
        </div>
        <label style={{ display:"block", fontSize:12, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>닉네임 *</label>
        <input placeholder="예: 소희💰  (최대 10자)" maxLength={10} value={nick} onChange={e => setNick(e.target.value)} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"13px 16px", fontSize:16, fontWeight:700, outline:"none", marginBottom:16 }} />
        <label style={{ display:"block", fontSize:12, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>한 줄 소개</label>
        <input placeholder="예: 용돈 아끼고 닌텐도 살 거야 🎮  (최대 30자)" maxLength={30} value={bio} onChange={e => setBio(e.target.value)} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"13px 16px", fontSize:14, outline:"none", marginBottom:28 }} />
        <button onClick={submit} disabled={!nick.trim()} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background: nick.trim() ? "linear-gradient(135deg,#FF6B6B,#FF8E53)" : "#eee", color: nick.trim() ? "white" : "#ccc", fontSize:16, fontWeight:900, cursor: nick.trim() ? "pointer" : "not-allowed", boxShadow: nick.trim() ? "0 6px 20px rgba(255,107,107,0.4)" : "none", transition:"all .3s" }}>시작하기 🎉</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 지갑 카드
// ════════════════════════════════════════════════════════════
function WalletCard({ wallet, posts, onEdit }) {
  const cash = wallet.cash || 0; const card = wallet.card || 0; const total = cash + card;
  
  const isMinus = total < 0;

  return (
    <div style={{ background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", borderRadius:24, padding:"20px 20px 18px", marginBottom:16, color:"white", position:"relative", overflow:"hidden", boxShadow:"0 8px 28px rgba(255,107,107,0.32)" }}>
      <div style={{ position:"absolute", right:-24, top:-24, width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,.08)", pointerEvents:"none" }} />
      <div style={{ marginBottom:16, position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
          <div style={{ fontSize:11, fontWeight:700, color: isMinus ? "#FFD93D" : "white", opacity:.9, letterSpacing:".06em", paddingTop:4 }}>💰 총 잔액</div>
          <button onClick={onEdit} style={{ background:"rgba(255,255,255,.28)", border:"2px solid rgba(255,255,255,.5)", color:"white", borderRadius:12, padding:"8px 18px", fontSize:14, cursor:"pointer", fontWeight:800, zIndex:20, position:"relative" }}>✏️ 설정</button>
        </div>
        {/* 총 잔액이 마이너스면 빨간색 */}
        <div style={{ fontSize:34, fontWeight:900, letterSpacing:"-1px", color: isMinus ? "#FF2A2A" : "white", marginBottom:4 }}>{won(total)}</div>
        {isMinus && <div style={{ fontSize:12, color:"#FFD93D", fontWeight:900, animation:"pulse 1s infinite" }}>⚠️ 가진 돈보다 더 많이 썼어요!</div>}
      </div>
      <div style={{ display:"flex", gap:10, position:"relative", zIndex:10 }}>
        <div style={{ flex:1, background:"rgba(255,255,255,.15)", borderRadius:16, padding:"12px 14px" }}>
          <div style={{ fontSize:10, fontWeight:800, opacity:.85, marginBottom:4 }}>💵 현금</div>
          {/* 현금 마이너스 시 빨간색 표시 (작은 글씨는 완전히 지웠어!) */}
          <div style={{ fontSize:20, fontWeight:900, color: cash < 0 ? "#FF2A2A" : "white" }}>{won(cash)}</div>
        </div>
        <div style={{ flex:1, background:"rgba(255,255,255,.15)", borderRadius:16, padding:"12px 14px" }}>
          <div style={{ fontSize:10, fontWeight:800, opacity:.85, marginBottom:4 }}>💳 체크카드</div>
          {/* 체크카드 마이너스 시 빨간색 표시 (작은 글씨는 완전히 지웠어!) */}
          <div style={{ fontSize:20, fontWeight:900, color: card < 0 ? "#FF2A2A" : "white" }}>{won(card)}</div>
        </div>
      </div>
    </div>
  );
}

function WalletModal({ wallet, onSave, onClose }) {
  const [cash, setCash] = useState(wallet.cash > 0 ? String(wallet.cash) : "");
  const [card, setCard] = useState(wallet.card > 0 ? String(wallet.card) : "");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", padding:24 }}>
      <div style={{ background:"white", borderRadius:28, padding:28, width:"100%", maxWidth:360, animation:"slideUp .3s ease" }}>
        <h2 style={{ margin:"0 0 6px", fontWeight:900, color:"#1a1a2e" }}>💰 잔액 설정</h2>
        <p style={{ color:"#aaa", fontSize:13, marginBottom:22 }}>현재 가지고 있는 현금과 카드 잔액을 입력해요.</p>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>💵 현금 잔액</label>
        <div style={{ display:"flex", alignItems:"center", background:"#f8f8f8", borderRadius:14, padding:"0 16px", marginBottom:16 }}>
          <span style={{ fontSize:18, fontWeight:900, color:"#FF6B6B" }}>₩</span>
          <input type="number" placeholder="0" value={cash} onChange={e => setCash(e.target.value)} style={{ flex:1, border:"none", background:"none", padding:"14px 8px", fontSize:22, fontWeight:900, color:"#1a1a2e", outline:"none" }} />
        </div>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>💳 체크카드 잔액</label>
        <div style={{ display:"flex", alignItems:"center", background:"#f8f8f8", borderRadius:14, padding:"0 16px", marginBottom:24 }}>
          <span style={{ fontSize:18, fontWeight:900, color:"#45B7D1" }}>₩</span>
          <input type="number" placeholder="0" value={card} onChange={e => setCard(e.target.value)} style={{ flex:1, border:"none", background:"none", padding:"14px 8px", fontSize:22, fontWeight:900, color:"#1a1a2e", outline:"none" }} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:14, borderRadius:16, border:"2px solid #eee", background:"white", color:"#aaa", fontSize:14, cursor:"pointer", fontWeight:700 }}>취소</button>
          <button onClick={() => onSave({ cash: Number(cash)||0, card: Number(card)||0 })} style={{ flex:2, padding:14, borderRadius:16, border:"none", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", color:"white", fontSize:14, fontWeight:900, cursor:"pointer" }}>저장하기 ✓</button>
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, onEdit }) {
  if (!goal) return <button onClick={onEdit} style={{ width:"100%", padding:"14px 20px", borderRadius:18, border:"2px dashed #ddd", background:"white", color:"#ccc", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>🐷 저축 목표 설정하기</button>;
  const pct = Math.min((goal.saved / goal.target) * 100, 100);
  return (
    <div style={{ background:"white", borderRadius:20, padding:"18px 20px", marginBottom:16, boxShadow:"0 2px 16px rgba(0,0,0,.07)", border:"2px solid #f0f0ff" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:28 }}>{goal.emoji}</span>
          <div><div style={{ fontWeight:800, fontSize:14, color:"#1a1a2e" }}>{goal.title}</div><div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>목표 {won(goal.target)}</div></div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:18, fontWeight:900, color:"#A29BFE" }}>{won(goal.saved)}</div>
          <div style={{ fontSize:11, color:"#bbb" }}>남은 {won(Math.max(0, goal.target - goal.saved))}</div>
        </div>
      </div>
      <div style={{ height:10, background:"#f0f0ff", borderRadius:8, overflow:"hidden", marginBottom:6 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#A29BFE,#6C5CE7)", borderRadius:8, transition:"width 1.2s cubic-bezier(.34,1.56,.64,1)" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#aaa" }}>
        <span>{Math.round(pct)}% 달성!</span>
        <button onClick={onEdit} style={{ background:"none", border:"none", color:"#A29BFE", fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>수정 ✏️</button>
      </div>
      {pct >= 100 && <div style={{ textAlign:"center", marginTop:10, fontSize:18, animation:"pulse 1.2s infinite" }}>🎉 목표 달성!</div>}
    </div>
  );
}

function IncomeCard({ post, profile, onDelete }) {
  const [menu, setMenu] = useState(false);
  return (
    <div style={{ background:"linear-gradient(135deg,#E8F5E9,#F1F8E9)", borderRadius:22, overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,.06)", marginBottom:18, border:"2px solid #C8E6C9", animation:"slideUp .4s ease" }}>
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#66BB6A,#43A047)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>💵</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:13, color:"#1a1a2e" }}>{profile?.nickname || "나"}</div>
          <div style={{ fontSize:11, color:"#aaa", marginTop:1 }}>{fmtD(post.date)}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <div style={{ background:"#E8F5E9", color:"#2E7D32", padding:"3px 8px", borderRadius:20, fontSize:10, fontWeight:700 }}>💰 용돈수입</div>
          <button onClick={() => setMenu(v => !v)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#ccc", padding:0 }}>⋯</button>
        </div>
      </div>
      {menu && <div style={{ margin:"0 16px 10px", background:"#fff5f5", borderRadius:14, border:"1px solid #ffe0e0" }}><button onTouchEnd={e=>{e.preventDefault();onDelete(post.id);setMenu(false);}} onClick={()=>{onDelete(post.id);setMenu(false);}} style={{ width:"100%", padding:"12px 16px", background:"none", border:"none", color:"#FF6B6B", fontWeight:700, cursor:"pointer", textAlign:"left", fontSize:14 }}>🗑️ 삭제</button></div>}
      <div style={{ padding:"0 16px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"white", borderRadius:16, padding:"14px 18px" }}>
          <div style={{ fontSize:14, color:"#555", fontWeight:600, flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{post.memo || "용돈"}</div>
          <div style={{ fontSize:20, fontWeight:900, color:"#2E7D32", flexShrink:0, marginLeft:8 }}>+{won(post.amount)}</div>
        </div>
      </div>
    </div>
  );
}

function IncomeModal({ onClose, onAdd }) {
  const [amount, setAmt] = useState(""); const [memo, setMemo] = useState(""); const [payMethod, setPay] = useState("cash");
  const amtRef = useRef();
  const QUICK = ["할머니가 주심 💝","할아버지가 주심 💝","어린이날 용돈 🎈","생일 용돈 🎂","심부름 💪","세뱃돈 🎍","기타 용돈 💵"];
  const submit = () => { if (!amount) return; onAdd({ id: Date.now(), date: new Date().toISOString(), type:"income", amount: Number(amount), memo, imageUrl: null, category:"income", sticker:"💵", liked:false, payMethod }); onClose(); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:300, display:"flex", alignItems:"flex-end", backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", width:"100%", maxWidth:430, margin:"0 auto", borderRadius:"28px 28px 0 0", padding:"20px 20px 48px", maxHeight:"85vh", overflowY:"auto", overscrollBehavior:"contain", touchAction:"pan-y", animation:"modalUp .35s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width:40, height:5, background:"#eee", borderRadius:4, margin:"0 auto 18px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:"#1a1a2e" }}>💵 용돈 추가</h2>
          <button onClick={onClose} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>누구한테 받았어요?</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
          {QUICK.map(q => <button key={q} onClick={() => setMemo(q)} style={{ padding:"8px 14px", borderRadius:20, border:`2px solid ${memo===q?"#66BB6A":"#eee"}`, background:memo===q?"#E8F5E9":"white", color:memo===q?"#2E7D32":"#888", fontSize:13, fontWeight:700, cursor:"pointer" }}>{q}</button>)}
        </div>
        <input placeholder="직접 입력..." value={memo} onChange={e => setMemo(e.target.value)} maxLength={30} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"12px 16px", fontSize:15, outline:"none", marginBottom:20, boxSizing:"border-box" }} />
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>어디에 받았어요?</label>
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          <button onClick={() => setPay("cash")} style={{ flex:1, padding:"12px 0", borderRadius:16, border:`2px solid ${payMethod==="cash"?"#66BB6A":"#eee"}`, background:payMethod==="cash"?"#f0fff4":"white", color:payMethod==="cash"?"#2E7D32":"#aaa", fontSize:14, fontWeight:800, cursor:"pointer" }}>💵 현금</button>
          <button onClick={() => setPay("card")} style={{ flex:1, padding:"12px 0", borderRadius:16, border:`2px solid ${payMethod==="card"?"#45B7D1":"#eee"}`, background:payMethod==="card"?"#f0f9ff":"white", color:payMethod==="card"?"#45B7D1":"#aaa", fontSize:14, fontWeight:800, cursor:"pointer" }}>💳 카드충전</button>
        </div>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>얼마 받았어요?</label>
        <div onClick={() => amtRef.current?.focus()} style={{ display:"flex", alignItems:"center", background:"#f0fff4", borderRadius:16, padding:"0 18px", marginBottom:24, border:"2px solid #C8E6C9", cursor:"text" }}>
          <span style={{ fontSize:20, fontWeight:900, color:"#2E7D32" }}>₩</span>
          <input ref={amtRef} type="number" placeholder="0" value={amount} onChange={e => setAmt(e.target.value)} style={{ flex:1, border:"none", background:"none", padding:"14px 8px", fontSize:28, fontWeight:900, color:"#1a1a2e", outline:"none" }} />
        </div>
        <button onClick={submit} disabled={!amount} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background:amount?"linear-gradient(135deg,#66BB6A,#43A047)":"#eee", color:amount?"white":"#bbb", fontSize:16, fontWeight:900, cursor:amount?"pointer":"not-allowed" }}>💰 용돈 추가하기</button>
      </div>
    </div>
  );
}

function PostCard({ post, profile, onLike, onDelete, onEdit, onComment }) {
  const [liked, setLiked] = useState(post.liked); const [heart, setHeart] = useState(false); const [menu, setMenu] = useState(false);
  const c = CAT(post.category);
  const doubleTap = () => { if (!liked) { setLiked(true); onLike(post.id); } setHeart(true); setTimeout(() => setHeart(false), 700); };
  return (
    <div style={{ background:"white", borderRadius:22, overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,.07)", marginBottom:18, animation:"slideUp .4s ease", width:"100%" }}>
      <div onClick={() => onComment && onComment(post)} style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", width:"100%", boxSizing:"border-box" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", overflow:"hidden", flexShrink:0, boxShadow:`0 0 0 2px white,0 0 0 3.5px ${c.color}` }}>
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,${c.color},${c.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🐰</div>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:13, color:"#1a1a2e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile?.nickname || "나의 소비일기"}</div>
          <div style={{ fontSize:11, color:"#bbb", marginTop:1 }}>{fmtD(post.date)}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
          <div style={{ background:`${c.color}18`, color:c.color, padding:"3px 7px", borderRadius:20, fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>{c.emoji} {c.label}</div>
          {post.payMethod === "card" ? <div style={{ background:"#e3f6fd", color:"#45B7D1", padding:"3px 6px", borderRadius:10, fontSize:10, fontWeight:800 }}>💳</div> : <div style={{ background:"#f0f0f0", color:"#aaa", padding:"3px 6px", borderRadius:10, fontSize:10, fontWeight:800 }}>💵</div>}
          <button onClick={(e) => { e.stopPropagation(); setMenu(v => !v); }} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#ccc", padding:"0 2px", lineHeight:1 }}>⋯</button>
        </div>
      </div>
      {menu && <div style={{ margin:"0 14px 10px", background:"#f8f8f8", borderRadius:14, border:"1px solid #eee", overflow:"hidden" }}>
        <button onTouchEnd={e => { e.preventDefault(); onEdit(post); setMenu(false); }} onClick={() => { onEdit(post); setMenu(false); }} style={{ width:"100%", padding:"14px 16px", background:"none", border:"none", borderBottom:"1px solid #eee", color:"#1a1a2e", fontWeight:700, cursor:"pointer", textAlign:"left", fontSize:15 }}>✏️ 게시물 수정</button>
        <button onTouchEnd={e => { e.preventDefault(); onDelete(post.id); setMenu(false); }} onClick={() => { onDelete(post.id); setMenu(false); }} style={{ width:"100%", padding:"14px 16px", background:"none", border:"none", color:"#FF6B6B", fontWeight:700, cursor:"pointer", textAlign:"left", fontSize:15 }}>🗑️ 게시물 삭제</button>
      </div>}
      {post.imageUrl ? <div style={{ position:"relative", cursor:"pointer" }} onDoubleClick={doubleTap}><img src={post.imageUrl} alt="" style={{ width:"100%", aspectRatio:"1/1", objectFit:"cover", display:"block" }} />{heart && <div style={{ position:"absolute", top:"50%", left:"50%", fontSize:80, animation:"heartPop .7s ease forwards", pointerEvents:"none" }}>❤️</div>}</div> : null}
      <div style={{ padding: post.imageUrl ? "11px 14px 6px" : "4px 14px 6px", boxSizing:"border-box" }}>
        {!post.imageUrl && <div onDoubleClick={doubleTap} style={{ display:"flex", alignItems:"center", gap:10, background:`${c.color}0e`, borderRadius:14, padding:"12px 14px", marginBottom:10, cursor:"pointer" }}>
          <span style={{ fontSize:30, flexShrink:0 }}>{post.sticker || c.emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>{post.memo ? <div style={{ fontSize:13, color:"#333", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{post.memo}</div> : <div style={{ fontSize:13, color:"#bbb" }}>기록 없음</div>}</div>
          <div style={{ background:`linear-gradient(135deg,${c.color},${c.color}bb)`, color:"white", padding:"6px 12px", borderRadius:16, fontSize:14, fontWeight:900, flexShrink:0 }}>-{won(post.amount)}</div>
        </div>}
        {post.imageUrl && <><div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => { const n = !liked; setLiked(n); if (n) onLike(post.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:24, padding:0, transition:"transform .2s", transform: liked ? "scale(1.2)" : "scale(1)", flexShrink:0 }}>{liked ? "❤️" : "🤍"}</button>
          {post.sticker && <span style={{ fontSize:20 }}>{post.sticker}</span>}
          <div style={{ marginLeft:"auto", background:`linear-gradient(135deg,${c.color},${c.color}bb)`, color:"white", padding:"6px 14px", borderRadius:20, fontSize:15, fontWeight:900, flexShrink:0 }}>-{won(post.amount)}</div>
        </div>{post.memo && <div style={{ marginTop:10, fontSize:14, color:"#333", lineHeight:1.6, overflow:"hidden" }}><span style={{ fontWeight:800 }}>{profile?.nickname || "나"} </span>{post.memo}</div>}</>}
        {!post.imageUrl && <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:4 }}><button onClick={() => { const n = !liked; setLiked(n); if (n) onLike(post.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, padding:0 }}>{liked ? "❤️" : "🤍"}</button></div>}
      </div>
      <div style={{ height: post.imageUrl ? 14 : 6 }} />
    </div>
  );
}

function EditModal({ post, onClose, onSave }) {
  const [img, setImg] = useState(post.imageUrl); const [amount, setAmt] = useState(String(post.amount)); const [memo, setMemo] = useState(post.memo || "");
  const [cat, setCat] = useState(post.category); const [sticker, setSt] = useState(post.sticker || ""); const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const handleFile = async (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = async ev => { const c = await compressImage(ev.target.result); setImg(c); setUploading(true); const u = await uploadToCloudinary(c); if (u) setImg(u); setUploading(false); }; r.readAsDataURL(f); };
  const submit = () => { if (!amount) return; onSave({ ...post, imageUrl: img, amount: Number(amount), memo, category: cat, sticker }); onClose(); };
  const cc = CAT(cat);
  return (
    <div style={{ position:"fixed", inset:0, background:"white", zIndex:300, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #f0f0f0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:"#1a1a2e" }}>✏️ 게시물 수정</h2>
        <button onClick={onClose} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:36, height:36, cursor:"pointer", fontSize:18 }}>✕</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", overscrollBehavior:"contain", touchAction:"pan-y", padding:"16px 20px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18, background:"#f8f8f8", borderRadius:16, padding:12 }}>
          <div onClick={() => fileRef.current.click()} style={{ position:"relative", cursor:"pointer", flexShrink:0 }}>
            <div style={{ width:80, height:80, borderRadius:14, overflow:"hidden", background:`${cc.color}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>{img ? <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:36 }}>{sticker || cc.emoji}</span>}</div>
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.25)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ color:"white", fontSize:11, fontWeight:800 }}>{uploading ? "업로드중" : "📷 변경"}</span></div>
          </div>
          <div style={{ fontSize:13, color:"#aaa" }}>사진을 탭해서 변경하거나<br/>아래 내용만 수정할 수 있어요</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>카테고리</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>{CATEGORIES.map(c => <button key={c.id} onClick={() => setCat(c.id)} style={{ padding:"6px 13px", borderRadius:20, border:`2px solid ${cat===c.id?c.color:"#eee"}`, background:cat===c.id?`${c.color}18`:"white", color:cat===c.id?c.color:"#aaa", fontSize:12, fontWeight:700, cursor:"pointer" }}>{c.emoji} {c.label}</button>)}</div>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>금액</label>
        <div style={{ display:"flex", alignItems:"center", background:"#f8f8f8", borderRadius:16, padding:"0 18px", marginBottom:18 }}><span style={{ fontSize:20, fontWeight:900, color:cc.color }}>₩</span><input type="number" value={amount} onChange={e => setAmt(e.target.value)} style={{ flex:1, border:"none", background:"none", padding:"14px 8px", fontSize:28, fontWeight:900, color:"#1a1a2e", outline:"none" }} /></div>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>메모</label>
        <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={2} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:16, padding:"13px 16px", fontSize:14, resize:"none", outline:"none", boxSizing:"border-box", marginBottom:18 }} />
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>스티커</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:24 }}>{STICKERS.map(s => <button key={s} onClick={() => setSt(sticker===s?"":s)} style={{ fontSize:26, background:sticker===s?"#fff0f0":"#fafafa", border:`2px solid ${sticker===s?"#FF6B6B":"transparent"}`, borderRadius:12, padding:"6px 0", cursor:"pointer", transform:sticker===s?"scale(1.15)":"scale(1)" }}>{s}</button>)}</div>
        <button onClick={submit} disabled={!amount} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background:amount?"linear-gradient(135deg,#FF6B6B,#FF8E53)":"#eee", color:amount?"white":"#bbb", fontSize:16, fontWeight:900, cursor:amount?"pointer":"not-allowed" }}>수정 완료 ✓</button>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  const [step, setStep] = useState(1); const [img, setImg] = useState(null); const [amount, setAmt] = useState(""); const [memo, setMemo] = useState("");
  const [cat, setCat] = useState("food"); const [sticker, setSt] = useState(""); const [payMethod, setPay] = useState("cash");
  const fileRef = useRef();
  
  const handleFile = async (e) => { 
    const f = e.target.files[0]; if (!f) return; 
    const r = new FileReader(); 
    r.onload = async ev => { 
      const c = await compressImage(ev.target.result); 
      setImg(c); setStep(2); 
      const u = await uploadToCloudinary(c); if (u) setImg(u); 
    }; 
    r.readAsDataURL(f); 
  };

  // ★ 이 submit 함수에서 type: "expense"를 정확히 넣어주도록 수정함!
  const submit = () => { 
    if (!amount) return; 
    onAdd({ 
      id: Date.now(), 
      date: new Date().toISOString(), 
      type: "expense", // 이 부분이 들어가야 지갑에서 돈이 깎여!
      imageUrl: img, 
      amount: Number(amount), 
      memo, 
      category: cat, 
      sticker, 
      liked: false, 
      payMethod 
    }); 
    onClose(); 
  };

  const cc = CAT(cat);
  return (
    <div style={{ position:"fixed", inset:0, background:"white", zIndex:300, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"14px 20px 10px", borderBottom:"1px solid #f0f0f0", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:"#1a1a2e" }}>{step===1?"📸 사진 추가":step===2?"💰 내용 입력":"✨ 스티커 고르기"}</h2>
          <button onClick={onClose} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:36, height:36, cursor:"pointer", fontSize:18 }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:6 }}>{[1,2,3].map(s => <div key={s} style={{ height:5, flex:1, borderRadius:4, background: s<=step?"#FF6B6B":"#eee", transition:"background .3s" }} />)}</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", overscrollBehavior:"contain", touchAction:"pan-y", padding:"18px 20px 40px" }}>
        {step===1 && <><div onClick={() => fileRef.current.click()} style={{ border:"2px dashed #e0e0e0", borderRadius:20, aspectRatio:"1/1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:14, background:"#fafafa" }}><span style={{ fontSize:56 }}>📷</span><span style={{ color:"#bbb", fontSize:14 }}>탭해서 사진 선택</span></div><input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} /><button onClick={() => setStep(2)} style={{ width:"100%", marginTop:12, padding:14, borderRadius:16, border:"none", background:"#f5f5f5", color:"#bbb", fontSize:14, cursor:"pointer", fontWeight:700 }}>사진 없이 계속하기 →</button></>}
        {step===2 && <>{img && <img src={img} alt="" style={{ width:"100%", aspectRatio:"1/1", objectFit:"cover", borderRadius:18, marginBottom:16 }} />}
          <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>결제 수단</label>
          <div style={{ display:"flex", gap:10, marginBottom:18 }}><button onClick={() => setPay("cash")} style={{ flex:1, padding:"12px 0", borderRadius:16, border:`2px solid ${payMethod==="cash"?"#FF6B6B":"#eee"}`, background:payMethod==="cash"?"#fff0f0":"white", color:payMethod==="cash"?"#FF6B6B":"#aaa", fontSize:14, fontWeight:800, cursor:"pointer" }}>💵 현금</button><button onClick={() => setPay("card")} style={{ flex:1, padding:"12px 0", borderRadius:16, border:`2px solid ${payMethod==="card"?"#45B7D1":"#eee"}`, background:payMethod==="card"?"#f0f9ff":"white", color:payMethod==="card"?"#45B7D1":"#aaa", fontSize:14, fontWeight:800, cursor:"pointer" }}>💳 카드</button></div>
          <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>카테고리</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>{CATEGORIES.map(cc => <button key={cc.id} onClick={() => setCat(cc.id)} style={{ padding:"6px 13px", borderRadius:20, border:`2px solid ${cat===cc.id?cc.color:"#eee"}`, background:cat===cc.id?`${cc.color}18`:"white", color:cat===cc.id?cc.color:"#aaa", fontSize:12, fontWeight:700, cursor:"pointer" }}>{cc.emoji} {cc.label}</button>)}</div>
          <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>얼마 썼어요?</label>
          <div style={{ display:"flex", alignItems:"center", background:"#f8f8f8", borderRadius:16, padding:"0 18px", marginBottom:18 }}><span style={{ fontSize:20, fontWeight:900, color:cc.color }}>₩</span><input type="number" placeholder="0" value={amount} onChange={e => setAmt(e.target.value)} style={{ flex:1, border:"none", background:"none", padding:"14px 8px", fontSize:28, fontWeight:900, color:"#1a1a2e", outline:"none" }} /></div>
          <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>어떤 걸 샀어요?</label>
          <textarea placeholder="오늘 이걸 샀어요 😊" value={memo} onChange={e => setMemo(e.target.value)} rows={2} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:16, padding:"13px 16px", fontSize:14, resize:"none", outline:"none", boxSizing:"border-box", marginBottom:20 }} />
          <button onClick={() => setStep(3)} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", color:"white", fontSize:16, fontWeight:900, cursor:"pointer" }}>다음 →</button></>}
        {step===3 && <><p style={{ textAlign:"center", color:"#aaa", fontSize:14, marginBottom:20 }}>스티커를 골라 게시물을 꾸며봐요!</p><div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:28 }}>{STICKERS.map(s => <button key={s} onClick={() => setSt(s)} style={{ fontSize:28, background:sticker===s?"#fff0f0":"#fafafa", border:`2px solid ${sticker===s?"#FF6B6B":"transparent"}`, borderRadius:14, padding:"8px 0", cursor:"pointer", transform:sticker===s?"scale(1.18)":"scale(1)" }}>{s}</button>)}</div><button onClick={submit} disabled={!amount} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background:amount?"linear-gradient(135deg,#FF6B6B,#FF8E53)":"#eee", color:amount?"white":"#bbb", fontSize:16, fontWeight:900, cursor:amount?"pointer":"not-allowed" }}>🎉 게시하기!</button></>}
      </div>
    </div>
  );
}

const GOAL_EMOJIS = ["🎮","👟","🎒","📱","🍰","🐶","✈️","📚","🎸","💄","🎠","⭐"];
function GoalModal({ goal, onSave, onClose }) {
  const [title, setTitle] = useState(goal?.title || ""); const [target, setTarget] = useState(goal?.target ? String(goal.target) : "");
  const [saved, setSaved] = useState(goal?.saved ? String(goal.saved) : ""); const [emoji, setEmoji] = useState(goal?.emoji || "🎮");
  const submit = () => { if (!title || !target) return; onSave({ title, target: Number(target), saved: Number(saved)||0, emoji }); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", padding:24 }}>
      <div style={{ background:"white", borderRadius:28, padding:28, width:"100%", maxWidth:360, animation:"slideUp .3s ease" }}>
        <h2 style={{ margin:"0 0 6px", fontWeight:900, color:"#1a1a2e" }}>🐷 저축 목표 설정</h2>
        <p style={{ color:"#aaa", fontSize:13, marginBottom:18 }}>무엇을 위해 모으고 있나요?</p>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>이모지 선택</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:18 }}>{GOAL_EMOJIS.map(e => <button key={e} onClick={() => setEmoji(e)} style={{ fontSize:24, background:emoji===e?"#f0f0ff":"#fafafa", border:`2px solid ${emoji===e?"#A29BFE":"transparent"}`, borderRadius:12, padding:"6px 0", cursor:"pointer" }}>{e}</button>)}</div>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>목표 이름</label>
        <input placeholder="예: 닌텐도 게임 사기" value={title} onChange={e => setTitle(e.target.value)} maxLength={20} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"12px 16px", fontSize:15, outline:"none", marginBottom:14, boxSizing:"border-box" }} />
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>목표 금액 (₩)</label>
        <input type="number" placeholder="예: 60000" value={target} onChange={e => setTarget(e.target.value)} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"12px 16px", fontSize:15, outline:"none", marginBottom:14, boxSizing:"border-box" }} />
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>지금까지 모은 금액 (₩)</label>
        <input type="number" placeholder="예: 15000" value={saved} onChange={e => setSaved(e.target.value)} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"12px 16px", fontSize:15, outline:"none", marginBottom:22, boxSizing:"border-box" }} />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:14, borderRadius:16, border:"2px solid #eee", background:"white", color:"#aaa", fontSize:14, cursor:"pointer", fontWeight:700 }}>취소</button>
          <button onClick={submit} disabled={!title||!target} style={{ flex:2, padding:14, borderRadius:16, border:"none", background:title&&target?"linear-gradient(135deg,#A29BFE,#6C5CE7)":"#eee", color:title&&target?"white":"#bbb", fontSize:14, fontWeight:900, cursor:title&&target?"pointer":"not-allowed" }}>저장하기 ✓</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 통계 탭 (📤 공유 버튼 추가)
// ════════════════════════════════════════════════════════════
function StatsTab({ posts, profile }) {
  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [shareUrl, setShareUrl] = useState(null);

  const months = [...new Set(posts.map(p => { const d = new Date(p.date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }))].sort().reverse();
  const isSel = (d) => { const t = new Date(d); return t.getFullYear() === selYear && t.getMonth()+1 === selMonth; };
  const mp = posts.filter(p => isSel(p.date));
  const expense = mp.filter(p => p.type !== "income");
  const income  = mp.filter(p => p.type === "income");
  const totalExp = expense.reduce((s,p) => s+p.amount, 0);
  const totalInc = income.reduce((s,p) => s+p.amount, 0);
  const cashExp = expense.filter(p => !p.payMethod||p.payMethod==="cash").reduce((s,p)=>s+p.amount,0);
  const cardExp = expense.filter(p => p.payMethod==="card").reduce((s,p)=>s+p.amount,0);
  const categoryStats = CATEGORIES.map(c => ({ id:c.id, amount: expense.filter(p=>p.category===c.id).reduce((s,p)=>s+p.amount,0) })).filter(c=>c.amount>0).sort((a,b)=>b.amount-a.amount);

  const handleShare = () => {
    const data = {
      nickname: profile?.nickname || "나",
      year: selYear, month: selMonth,
      totalInc, totalExp, cashExp, cardExp,
      categoryStats,
      records: mp.sort((a,b) => new Date(b.date)-new Date(a.date)).map(p => ({ type:p.type, amount:p.amount, memo:p.memo, date:p.date, category:p.category, sticker:p.sticker }))
    };
    const encoded = encodeData(data);
    if (!encoded) { alert("공유 링크 생성 실패 😢"); return; }
    const url = `${window.location.origin}?stats=${encoded}`;
    setShareUrl(url);
  };

  const copyUrl = () => { navigator.clipboard.writeText(shareUrl).then(() => alert("링크 복사됐어요! 📋")).catch(() => alert(shareUrl)); };

  return (
    <div>
      <div style={{ background:"white", borderRadius:20, padding:"14px 16px", marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize:11, fontWeight:800, color:"#bbb", marginBottom:10, letterSpacing:".06em" }}>월 선택</div>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
          {months.length === 0 ? <div style={{ fontSize:13, color:"#ddd" }}>기록이 없어요</div>
            : months.map(m => { const [y,mo] = m.split("-").map(Number); const isActive = y===selYear&&mo===selMonth;
              return <button key={m} onClick={() => { setSelYear(y); setSelMonth(mo); setShareUrl(null); }} style={{ flexShrink:0, padding:"8px 16px", borderRadius:20, border:`2px solid ${isActive?"#FF6B6B":"#eee"}`, background:isActive?"#FF6B6B":"white", color:isActive?"white":"#888", fontSize:13, fontWeight:700, cursor:"pointer" }}>{y!==now.getFullYear()?`${y}년 `:""}{KR_MONTHS[mo-1]}</button>;
            })}
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, background:"linear-gradient(135deg,#E8F5E9,#F1F8E9)", borderRadius:20, padding:"16px 18px", boxShadow:"0 2px 12px rgba(0,0,0,.06)", border:"2px solid #C8E6C9" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"#66BB6A", marginBottom:4 }}>{selMonth}월 수입</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#2E7D32" }}>+{won(totalInc)}</div>
          <div style={{ fontSize:11, color:"#aaa", marginTop:4 }}>{income.length}건</div>
        </div>
        <div style={{ flex:1, background:"linear-gradient(135deg,#FFF3F3,#FFF8F8)", borderRadius:20, padding:"16px 18px", boxShadow:"0 2px 12px rgba(0,0,0,.06)", border:"2px solid #FFCDD2" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"#FF6B6B", marginBottom:4 }}>{selMonth}월 지출</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#FF6B6B" }}>-{won(totalExp)}</div>
          <div style={{ fontSize:11, color:"#aaa", marginTop:4 }}>{expense.length}건</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, background:"white", borderRadius:20, padding:"14px 16px", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"#aaa", marginBottom:4 }}>💵 현금 지출</div>
          <div style={{ fontSize:18, fontWeight:900, color:"#FF6B6B" }}>-{won(cashExp)}</div>
        </div>
        <div style={{ flex:1, background:"white", borderRadius:20, padding:"14px 16px", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"#aaa", marginBottom:4 }}>💳 카드 지출</div>
          <div style={{ fontSize:18, fontWeight:900, color:"#45B7D1" }}>-{won(cardExp)}</div>
        </div>
      </div>

      <button onClick={handleShare} style={{ width:"100%", padding:"14px 0", borderRadius:18, border:"none", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", color:"white", fontSize:15, fontWeight:900, cursor:"pointer", marginBottom:14, boxShadow:"0 4px 14px rgba(255,107,107,.35)" }}>
        📤 {selYear !== now.getFullYear() ? `${selYear}년 ` : ""}{KR_MONTHS[selMonth-1]} 통계 공유하기
      </button>

      {shareUrl && (
        <div style={{ background:"white", borderRadius:18, padding:18, marginBottom:14, boxShadow:"0 2px 12px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:12, color:"#aaa", marginBottom:8 }}>👇 이 링크를 부모님께 보내세요!</div>
          <div style={{ fontSize:11, color:"#666", wordBreak:"break-all", marginBottom:12, lineHeight:1.5, background:"#f8f8f8", borderRadius:10, padding:"10px 12px" }}>{shareUrl.length > 80 ? shareUrl.slice(0,80) + "..." : shareUrl}</div>
          <button onClick={copyUrl} style={{ width:"100%", padding:"12px 0", borderRadius:14, border:"none", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", color:"white", fontSize:14, fontWeight:800, cursor:"pointer" }}>📋 링크 복사</button>
        </div>
      )}

      <div style={{ background:"white", borderRadius:22, padding:22, marginBottom:14, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin:"0 0 16px", fontWeight:900, fontSize:15, color:"#1a1a2e" }}>📊 카테고리별 지출</h3>
        {CATEGORIES.map(cc => { const t = expense.filter(p=>p.category===cc.id).reduce((s,p)=>s+p.amount,0); const pct = totalExp>0?(t/totalExp*100):0; if(t===0) return null;
          return <div key={cc.id} style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:13, fontWeight:700 }}>{cc.emoji} {cc.label}</span><span style={{ fontSize:13, fontWeight:900, color:cc.color }}>{won(t)}</span></div><div style={{ height:10, background:"#f4f4f8", borderRadius:8, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${cc.color},${cc.color}88)`, borderRadius:8, transition:"width .8s ease" }} /></div><div style={{ fontSize:11, color:"#ccc", marginTop:2 }}>{Math.round(pct)}%</div></div>;
        })}
        {totalExp === 0 && <div style={{ textAlign:"center", color:"#ddd", padding:"20px 0", fontSize:14 }}>지출 내역이 없어요</div>}
      </div>

      <div style={{ background:"white", borderRadius:22, padding:22, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin:"0 0 16px", fontWeight:900, fontSize:15, color:"#1a1a2e" }}>🕐 {selMonth}월 전체 기록</h3>
        {mp.length===0 ? <div style={{ textAlign:"center", padding:"30px 0", color:"#ddd", fontSize:14 }}>이 달의 기록이 없어요</div>
          : [...mp].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p => { const isInc=p.type==="income"; const c=isInc?{color:"#66BB6A",emoji:"💵",label:"수입"}:CAT(p.category);
            return <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, paddingBottom:14, borderBottom:"1px solid #f8f8f8" }}>
              <div style={{ width:44, height:44, borderRadius:14, background:isInc?"#E8F5E9":`${c.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{p.sticker||c.emoji}</div>
              <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.memo||"기록 없음"}</div><div style={{ fontSize:11, color:"#bbb", marginTop:2 }}>{fmtD(p.date)} · {c.label}</div></div>
              <div style={{ fontWeight:900, color:isInc?"#2E7D32":c.color, fontSize:14, flexShrink:0 }}>{isInc?"+":"-"}{won(p.amount)}</div>
            </div>;
          })
        }
      </div>
    </div>
  );
}

function PostDetailModal({ post, profile, onClose, onLike, onDelete, onEdit }) {
  const [liked, setLiked] = useState(post.liked); const [heart, setHeart] = useState(false);
  const c = post.type==="income"?{color:"#66BB6A",emoji:"💵",label:"수입"}:CAT(post.category);
  const doubleTap = () => { if(!liked){setLiked(true);onLike(post.id);}setHeart(true);setTimeout(()=>setHeart(false),700); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"white", borderRadius:24, overflow:"hidden", width:"100%", maxWidth:400, maxHeight:"90vh", overflowY:"auto", overscrollBehavior:"contain", animation:"slideUp .3s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", overflow:"hidden", flexShrink:0, boxShadow:`0 0 0 2px white,0 0 0 3px ${c.color}` }}>{profile?.avatarUrl?<img src={profile.avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />:<div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,${c.color},${c.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🐰</div>}</div>
          <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:800, fontSize:13, color:"#1a1a2e" }}>{profile?.nickname||"나"}</div><div style={{ fontSize:11, color:"#bbb" }}>{fmtD(post.date)}</div></div>
          <div style={{ background:`${c.color}18`, color:c.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, marginRight:4 }}>{c.emoji} {c.label}</div>
          <button onClick={onClose} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:30, height:30, cursor:"pointer", fontSize:15, flexShrink:0 }}>✕</button>
        </div>
        <div style={{ position:"relative", cursor:"pointer" }} onDoubleClick={doubleTap}>
          {post.imageUrl?<img src={post.imageUrl} alt="" style={{ width:"100%", aspectRatio:"1/1", objectFit:"cover", display:"block" }} />:<div style={{ width:"100%", aspectRatio:"1/1", background:`linear-gradient(135deg,${c.color}18,${c.color}44)`, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:80 }}>{post.sticker||c.emoji}</span></div>}
          {heart&&<div style={{ position:"absolute", top:"50%", left:"50%", fontSize:80, animation:"heartPop .7s ease forwards", pointerEvents:"none" }}>❤️</div>}
        </div>
        <div style={{ padding:"12px 16px 6px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {post.type!=="income"&&<button onClick={()=>{const n=!liked;setLiked(n);if(n)onLike(post.id);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:26, padding:0, transition:"transform .2s", transform:liked?"scale(1.2)":"scale(1)" }}>{liked?"❤️":"🤍"}</button>}
            {post.sticker&&<span style={{ fontSize:20 }}>{post.sticker}</span>}
            <div style={{ marginLeft:"auto", background:`linear-gradient(135deg,${c.color},${c.color}bb)`, color:"white", padding:"7px 18px", borderRadius:20, fontSize:16, fontWeight:900 }}>{post.type==="income"?"+":"-"}{won(post.amount)}</div>
          </div>
          {post.memo&&<div style={{ marginTop:10, fontSize:14, color:"#333", lineHeight:1.6 }}><span style={{ fontWeight:800 }}>{profile?.nickname||"나"} </span>{post.memo}</div>}
        </div>
        {post.type!=="income"&&<div style={{ display:"flex", gap:8, padding:"10px 16px 16px" }}><button onClick={()=>{onEdit(post);onClose();}} style={{ flex:1, padding:"10px 0", borderRadius:14, border:"2px solid #eee", background:"white", color:"#555", fontSize:13, fontWeight:700, cursor:"pointer" }}>✏️ 수정</button><button onClick={()=>{onDelete(post.id);onClose();}} style={{ flex:1, padding:"10px 0", borderRadius:14, border:"none", background:"#fff0f0", color:"#FF6B6B", fontSize:13, fontWeight:700, cursor:"pointer" }}>🗑️ 삭제</button></div>}
        {post.type==="income"&&<div style={{ padding:"10px 16px 16px" }}><button onClick={()=>{onDelete(post.id);onClose();}} style={{ width:"100%", padding:"10px 0", borderRadius:14, border:"none", background:"#fff0f0", color:"#FF6B6B", fontSize:13, fontWeight:700, cursor:"pointer" }}>🗑️ 삭제</button></div>}
      </div>
    </div>
  );
}

function ProfileTab({ profile, posts, onEdit, onLike, onDelete, onEditPost }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const total = posts.filter(p=>p.type!=="income").reduce((s,p)=>s+p.amount,0);
  return (
    <div>
      {selectedPost && <PostDetailModal post={selectedPost} profile={profile} onClose={()=>setSelectedPost(null)} onLike={id=>{onLike(id);setSelectedPost(prev=>({...prev,liked:true}));}} onDelete={id=>{onDelete(id);setSelectedPost(null);}} onEdit={onEditPost} />}
      <div style={{ background:"white", borderRadius:22, padding:"28px 22px 22px", marginBottom:16, boxShadow:"0 2px 16px rgba(0,0,0,.06)", textAlign:"center" }}>
        <div style={{ width:88, height:88, borderRadius:"50%", overflow:"hidden", margin:"0 auto 14px", boxShadow:"0 0 0 3px white,0 0 0 5px #FF6B6B" }}>{profile.avatarUrl?<img src={profile.avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />:<div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>🐰</div>}</div>
        <div style={{ fontSize:20, fontWeight:900, color:"#1a1a2e", marginBottom:6 }}>{profile.nickname}</div>
        {profile.bio&&<div style={{ fontSize:14, color:"#888", marginBottom:16 }}>{profile.bio}</div>}
        <div style={{ display:"flex", justifyContent:"center", gap:36, marginBottom:20 }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:20, fontWeight:900, color:"#1a1a2e" }}>{posts.length}</div><div style={{ fontSize:11, color:"#bbb" }}>기록</div></div>
          <div style={{ width:1, background:"#f0f0f0" }} />
          <div style={{ textAlign:"center" }}><div style={{ fontSize:20, fontWeight:900, color:"#FF6B6B" }}>{won(total)}</div><div style={{ fontSize:11, color:"#bbb" }}>총 지출</div></div>
        </div>
        <button onClick={onEdit} style={{ padding:"10px 28px", borderRadius:20, border:"2px solid #eee", background:"white", color:"#666", fontSize:13, fontWeight:700, cursor:"pointer" }}>✏️ 프로필 수정</button>
      </div>
      <div style={{ background:"white", borderRadius:22, padding:16, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin:"0 0 14px", fontWeight:900, fontSize:15, color:"#1a1a2e" }}>📸 내 게시물</h3>
        {posts.length===0?<div style={{ textAlign:"center", padding:"30px 0", color:"#ddd" }}><div style={{ fontSize:40 }}>📷</div><div style={{ marginTop:8, fontSize:14 }}>아직 기록이 없어요</div></div>
          :<div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:3 }}>{posts.map(p=>{const c=p.type==="income"?{color:"#66BB6A",emoji:"💵"} : CAT(p.category);return(<div key={p.id} onClick={()=>setSelectedPost(p)} style={{ aspectRatio:"1/1", borderRadius:8, overflow:"hidden", background:`${c.color}22`, cursor:"pointer", position:"relative" }}>{p.imageUrl?<img src={p.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />:<div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{p.sticker||c.emoji}</div>}{p.type==="income"&&<div style={{ position:"absolute", top:4, right:4, background:"#2E7D32", borderRadius:8, padding:"2px 5px", fontSize:9, color:"white", fontWeight:800 }}>수입</div>}</div>);})}</div>
        }
      </div>
    </div>
  );
}

function ProfileEditModal({ profile, onSave, onClose }) {
  const [nick, setNick] = useState(profile.nickname||""); const [bio, setBio] = useState(profile.bio||""); const [avatar, setAvatar] = useState(profile.avatarUrl||null);
  const fileRef = useRef(); const galleryRef = useRef();
  const handleFile = async (e) => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=async ev=>{const c=await compressImage(ev.target.result,400,0.85);setAvatar(c);const u=await uploadToCloudinary(c);if(u)setAvatar(u);}; r.readAsDataURL(f); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:300, display:"flex", alignItems:"flex-end", backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", width:"100%", maxWidth:430, margin:"0 auto", borderRadius:"28px 28px 0 0", padding:"20px 24px 48px", animation:"modalUp .35s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width:40, height:5, background:"#eee", borderRadius:4, margin:"0 auto 20px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:"#1a1a2e" }}>✏️ 프로필 수정</h2>
          <button onClick={onClose} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24, gap:12 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", overflow:"hidden", boxShadow:"0 4px 16px rgba(255,107,107,.3)" }}>{avatar?<img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />:<div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🐰</div>}</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>fileRef.current.click()} style={{ padding:"7px 16px", borderRadius:20, border:"2px solid #FF6B6B", background:"white", color:"#FF6B6B", fontSize:13, fontWeight:700, cursor:"pointer" }}>카메라</button>
            <button onClick={()=>galleryRef.current.click()} style={{ padding:"7px 16px", borderRadius:20, border:"2px solid #FF6B6B", background:"white", color:"#FF6B6B", fontSize:13, fontWeight:700, cursor:"pointer" }}>앨범</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handleFile} style={{ display:"none" }} />
          <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
        </div>
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>닉네임</label>
        <input maxLength={10} value={nick} onChange={e=>setNick(e.target.value)} style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"13px 16px", fontSize:16, fontWeight:700, outline:"none", marginBottom:16, boxSizing:"border-box" }} />
        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>한 줄 소개</label>
        <input maxLength={30} value={bio} onChange={e=>setBio(e.target.value)} placeholder="30자 이내" style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"13px 16px", fontSize:14, outline:"none", marginBottom:24, boxSizing:"border-box" }} />
        <button onClick={()=>nick.trim()&&onSave({...profile,nickname:nick.trim(),bio:bio.trim(),avatarUrl:avatar})} disabled={!nick.trim()} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background:nick.trim()?"linear-gradient(135deg,#FF6B6B,#FF8E53)":"#eee", color:nick.trim()?"white":"#bbb", fontSize:16, fontWeight:900, cursor:nick.trim()?"pointer":"not-allowed", boxShadow:nick.trim()?"0 4px 16px rgba(255,107,107,.4)":"none" }}>저장하기 ✓</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 메인 앱 (직관적 잔액 계산 방식)
// ════════════════════════════════════════════════════════════
export default function App() {
  const statsParam = new URLSearchParams(window.location.search).get("stats");
  if (statsParam) {
    const data = decodeData(statsParam);
    if (data) return <StatsShareView data={data} />;
  }

  const [profile, setProfile] = useState(() => LS.get("yd_profile"));
  const [posts,   setPosts]   = useState(() => LS.get("yd_posts", []));
  const [wallet,  setWallet]  = useState(() => LS.get("yd_wallet", { cash:0, card:0 }));
  const [goal,    setGoal]    = useState(() => LS.get("yd_goal", null));
  const [tab,      setTab]      = useState("feed");
  const [showAdd,    setShowAdd]    = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [editPost,   setEditPost]   = useState(null);
  const [showWallet, setShowWallet] = useState(false);
  const [showGoal,   setShowGoal]   = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(reg => {
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          newSW.addEventListener("statechange", () => { if (newSW.state==="installed"&&navigator.serviceWorker.controller) { newSW.postMessage("skipWaiting"); window.location.reload(); } });
        });
      });
    }
  }, []);

  // 단순 동기화용 이펙트
  useEffect(() => { LS.set("yd_profile", profile); }, [profile]);
  useEffect(() => { LS.set("yd_posts",   posts);   }, [posts]);
  useEffect(() => { LS.set("yd_wallet",  wallet);  }, [wallet]);
  useEffect(() => { LS.set("yd_goal",    goal);    }, [goal]);

// 1. 게시물 추가 시 잔액 연산 (완전 마이너스 허용)
  const handleAdd = useCallback(p => {
    setPosts(prev => [p, ...prev]);
    setWallet(prev => { 
      const n = { ...prev }; 
      if (p.type === "income") {
        if (p.payMethod === "card") n.card = (n.card || 0) + p.amount;
        else n.cash = (n.cash || 0) + p.amount;
      } else {
        if (p.payMethod === "card") n.card = (n.card || 0) - p.amount;
        else n.cash = (n.cash || 0) - p.amount;
      } 
      return n; 
    });
  }, []);

  const handleEdit = useCallback(p => setEditPost(p), []);
  
  // 2. 게시물 수정 시 잔액 연산 (완전 마이너스 허용)
  const handleSaveEdit = useCallback(updated => {
    setPosts(prev => {
      const oldPost = prev.find(p => p.id === updated.id);
      if (!oldPost) return prev;

      setWallet(walletPrev => {
        const n = { ...walletPrev };

        // [단계 1] 기존 금액 원상복구
        if (oldPost.type === "income") {
          if (oldPost.payMethod === "card") n.card = (n.card || 0) - oldPost.amount;
          else n.cash = (n.cash || 0) - oldPost.amount;
        } else {
          if (oldPost.payMethod === "card") n.card = (n.card || 0) + oldPost.amount;
          else n.cash = (n.cash || 0) + oldPost.amount;
        }

        // [단계 2] 새로운 금액 적용
        if (updated.type === "income") {
          if (updated.payMethod === "card") n.card = (n.card || 0) + updated.amount;
          else n.cash = (n.cash || 0) + updated.amount;
        } else {
          if (updated.payMethod === "card") n.card = (n.card || 0) - updated.amount;
          else n.cash = (n.cash || 0) - updated.amount;
        }

        return n;
      });

      return prev.map(p => p.id === updated.id ? updated : p);
    });
  }, []);

  const handleLike = useCallback(id => setPosts(prev => prev.map(p => p.id===id?{...p,liked:true}:p)), []);

  // 3. 게시물 삭제 시 잔액 연산 (완전 마이너스 허용)
  const handleDelete = useCallback(id => {
    if (window.confirm("이 게시물을 삭제할까요?")) {
      setPosts(prev => {
        const targetPost = prev.find(p => p.id === id);
        if (!targetPost) return prev;

        setWallet(walletPrev => {
          const n = { ...walletPrev };
          if (targetPost.type === "income") {
            if (targetPost.payMethod === "card") n.card = (n.card || 0) - targetPost.amount;
            else n.cash = (n.cash || 0) - targetPost.amount;
          } else {
            if (targetPost.payMethod === "card") n.card = (n.card || 0) + targetPost.amount;
            else n.cash = (n.cash || 0) + targetPost.amount;
          }
          return n;
        });

        return prev.filter(p => p.id !== id);
      });
    }
  }, []);

  if (!profile) return (<><style>{G}</style><Onboarding onDone={p=>setProfile(p)} /></>);

  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"#f4f4f8", fontFamily:"'Noto Sans KR',sans-serif", overflowX:"hidden", width:"100%" }}>
      <style>{G}</style>
      <div style={{ position:"sticky", top:0, zIndex:100, background:"white", boxShadow:"0 2px 8px rgba(0,0,0,.06)", width:"100%" }}>
        <div style={{ padding:"12px 14px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div><div style={{ fontSize:18, fontWeight:900, color:"#1a1a2e", letterSpacing:"-.5px" }}>💰 용돈일기</div><div style={{ fontSize:10, color:"#FF6B6B", fontWeight:700, marginTop:1 }}>나만의 소비 피드</div></div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setShowIncome(true)} style={{ height:36, padding:"0 14px", borderRadius:20, background:"linear-gradient(135deg,#56C96D,#3DB356)", border:"none", cursor:"pointer", color:"white", fontWeight:800, fontSize:14, whiteSpace:"nowrap", boxShadow:"0 4px 12px rgba(86,201,109,.45)" }}>수입</button>
            <button onClick={() => setShowAdd(true)} style={{ height:36, padding:"0 14px", borderRadius:20, background:"linear-gradient(135deg,#FF7B6B,#FF5347)", border:"none", cursor:"pointer", color:"white", fontWeight:800, fontSize:14, whiteSpace:"nowrap", boxShadow:"0 4px 12px rgba(255,107,107,.45)" }}>지출</button>
          </div>
        </div>
        <div style={{ display:"flex", borderTop:"1px solid #f0f0f0" }}>
          {[["feed","🏠 홈"],["stats","📊 통계"],["profile","👤 프로필"]].map(([id,label]) => (
            <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"10px 0", border:"none", background:"none", cursor:"pointer", fontSize:12, fontWeight:700, color:tab===id?"#FF6B6B":"#bbb", borderBottom:tab===id?"2.5px solid #FF6B6B":"2.5px solid transparent", transition:"all .2s" }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:"14px 12px 100px", width:"100%", boxSizing:"border-box" }}>
        {tab==="feed" && (<>
          <WalletCard wallet={wallet} posts={posts} onEdit={()=>setShowWallet(true)} />
          <GoalCard goal={goal} onEdit={()=>setShowGoal(true)} />
          {posts.length===0
            ? <div style={{ textAlign:"center", padding:"50px 0", color:"#ccc" }}><div style={{ fontSize:56 }}>📷</div><div style={{ marginTop:12, fontSize:15, fontWeight:700 }}>첫 번째 소비를 기록해봐요!</div><div style={{ marginTop:6, fontSize:13 }}>위 버튼을 눌러보세요 😊</div></div>
            : posts.map(p=>p.type==="income"?<IncomeCard key={p.id} post={p} profile={profile} onDelete={handleDelete} />:<PostCard key={p.id} post={p} profile={profile} onLike={handleLike} onDelete={handleDelete} onEdit={handleEdit} onComment={setCommentPostId} />)
          }
        </>)}
        {tab==="stats"   && <StatsTab posts={posts} profile={profile} />}
        {tab==="profile" && <ProfileTab profile={profile} posts={posts} onEdit={()=>setShowProfileEdit(true)} onLike={handleLike} onDelete={handleDelete} onEditPost={handleEdit} />}
      </div>
      {showIncome      && <IncomeModal      onClose={()=>setShowIncome(false)}      onAdd={handleAdd} />}
      {editPost        && <EditModal        post={editPost} onClose={()=>setEditPost(null)} onSave={handleSaveEdit} />}
      {showAdd         && <AddModal         onClose={()=>setShowAdd(false)}          onAdd={handleAdd} />}
      {showWallet      && <WalletModal      wallet={wallet} onSave={w=>{setWallet(w);setShowWallet(false);}} onClose={()=>setShowWallet(false)} />}
      {showGoal        && <GoalModal        goal={goal}     onSave={g=>{setGoal(g);setShowGoal(false);}}   onClose={()=>setShowGoal(false)} />}
      {showProfileEdit && <ProfileEditModal profile={profile} onSave={p=>{setProfile(p);setShowProfileEdit(false);}} onClose={()=>setShowProfileEdit(false)} />}
    </div>
  );
}
