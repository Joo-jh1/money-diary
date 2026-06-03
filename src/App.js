import { useState, useRef, useEffect, useCallback } from "react";

// ── 상수 ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "food",   label: "먹거리",  emoji: "🍕", color: "#FF6B6B" },
  { id: "fun",    label: "놀이",    emoji: "🎮", color: "#4ECDC4" },
  { id: "school", label: "학용품",  emoji: "📚", color: "#45B7D1" },
  { id: "gift",   label: "선물",    emoji: "🎁", color: "#F7A440" },
  { id: "saving", label: "저축",    emoji: "🐷", color: "#A29BFE" },
  { id: "etc",    label: "기타",    emoji: "✨", color: "#BB8FCE" },
];
const STICKERS = ["😋","🎉","💸","🛍️","💝","🌟","🎈","🍦","🎨","🏆","🐷","🌈"];
const CAT = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

// ── 저장소 ────────────────────────────────────────────────────
const LS = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── 유틸 ──────────────────────────────────────────────────────
const won  = (n) => Number(n || 0).toLocaleString("ko-KR") + "원";
const fmtD = (d) => new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
const thisMonth = (d) => { const n = new Date(), t = new Date(d); return n.getFullYear() === t.getFullYear() && n.getMonth() === t.getMonth(); };

// ── 전역 스타일 ───────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap');
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  body{margin:0;background:#f4f4f8;}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes modalUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes heartPop{0%{opacity:1;transform:translate(-50%,-50%) scale(.4)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.6)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
`;

// ════════════════════════════════════════════════════════════
// 온보딩 화면 (첫 실행)
// ════════════════════════════════════════════════════════════
function Onboarding({ onDone }) {
  const [nick, setNick]   = useState("");
  const [bio, setBio]     = useState("");
  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setAvatar(ev.target.result);
    r.readAsDataURL(f);
  };

  const submit = () => {
    if (!nick.trim()) return;
    onDone({ nickname: nick.trim(), bio: bio.trim(), avatarUrl: avatar, createdAt: new Date().toISOString() });
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#FF6B6B 0%,#FF8E53 40%,#FFD93D 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{G}</style>
      <div style={{ width:"100%", maxWidth:400, background:"white", borderRadius:32, padding:"36px 28px 32px", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", animation:"slideUp .5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>💰</div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:"#1a1a2e" }}>용돈일기</h1>
          <p style={{ margin:"8px 0 0", color:"#aaa", fontSize:14 }}>나만의 소비 피드를 만들어봐요!</p>
        </div>

        {/* 프로필 사진 */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div onClick={() => fileRef.current.click()} style={{ position:"relative", cursor:"pointer" }}>
            <div style={{ width:90, height:90, borderRadius:"50%", background: avatar ? "transparent" : "linear-gradient(135deg,#FF6B6B,#FF8E53)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", boxShadow:"0 4px 16px rgba(255,107,107,0.35)" }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:36 }}>🐰</span>
              }
            </div>
            <div style={{ position:"absolute", bottom:0, right:0, width:28, height:28, background:"#FF6B6B", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid white", fontSize:14 }}>📷</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
        </div>

        <label style={{ display:"block", fontSize:12, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>닉네임 *</label>
        <input
          placeholder="예: 소희💰  (최대 10자)"
          maxLength={10}
          value={nick}
          onChange={e => setNick(e.target.value)}
          style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"13px 16px", fontSize:16, fontWeight:700, outline:"none", marginBottom:16 }}
        />

        <label style={{ display:"block", fontSize:12, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>한 줄 소개</label>
        <input
          placeholder="예: 용돈 아끼고 닌텐도 살 거야 🎮  (최대 30자)"
          maxLength={30}
          value={bio}
          onChange={e => setBio(e.target.value)}
          style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"13px 16px", fontSize:14, outline:"none", marginBottom:28 }}
        />

        <button onClick={submit} disabled={!nick.trim()} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background: nick.trim() ? "linear-gradient(135deg,#FF6B6B,#FF8E53)" : "#eee", color: nick.trim() ? "white" : "#ccc", fontSize:16, fontWeight:900, cursor: nick.trim() ? "pointer" : "not-allowed", boxShadow: nick.trim() ? "0 6px 20px rgba(255,107,107,0.4)" : "none", transition:"all .3s" }}>
          시작하기 🎉
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 예산 카드
// ════════════════════════════════════════════════════════════
function BudgetCard({ budget, posts, onEdit }) {
  const mp    = posts.filter(p => thisMonth(p.date));
  const spent = mp.reduce((s, p) => s + p.amount, 0);
  const left  = budget - spent;
  const pct   = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const warn  = pct >= 80;

  return (
    <div style={{ background: warn ? "linear-gradient(135deg,#FF6B6B,#c0392b)" : "linear-gradient(135deg,#FF6B6B,#FF8E53)", borderRadius:24, padding:"22px 22px 20px", marginBottom:16, color:"white", position:"relative", overflow:"hidden", boxShadow:"0 8px 28px rgba(255,107,107,0.32)" }}>
      <div style={{ position:"absolute", right:-24, top:-24, width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,.08)" }} />
      <div style={{ position:"absolute", right:28, bottom:-36, width:72, height:72, borderRadius:"50%", background:"rgba(255,255,255,.06)" }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: budget > 0 ? 14 : 0 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, opacity:.8, letterSpacing:".06em", marginBottom:4 }}>이번 달 예산</div>
          <div style={{ fontSize:26, fontWeight:900 }}>{budget > 0 ? won(budget) : <span style={{ opacity:.6, fontSize:16 }}>예산을 설정해봐요</span>}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
          {budget > 0 && (
            <>
              <div style={{ fontSize:11, opacity:.8 }}>남은 금액</div>
              <div style={{ fontSize:20, fontWeight:900, color: left < 0 ? "#FFD93D" : "white" }}>{left < 0 ? "-" : ""}{won(Math.abs(left))}</div>
            </>
          )}
          <button onClick={onEdit} style={{ background:"rgba(255,255,255,.2)", border:"none", color:"white", borderRadius:12, padding:"5px 12px", fontSize:12, cursor:"pointer", fontWeight:700, marginTop:4 }}>✏️ 수정</button>
        </div>
      </div>

      {budget > 0 && (
        <>
          <div style={{ height:8, background:"rgba(255,255,255,.25)", borderRadius:8, overflow:"hidden", marginBottom:8 }}>
            <div style={{ height:"100%", width:`${pct}%`, background: warn ? "#FFD93D" : "rgba(255,255,255,.9)", borderRadius:8, transition:"width 1.2s cubic-bezier(.34,1.56,.64,1)" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, opacity:.85 }}>
            <span>사용 {won(spent)} ({Math.round(pct)}%)</span>
            {warn && <span style={{ color:"#FFD93D", fontWeight:800 }}>⚠️ 예산 주의!</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 저축 목표 카드
// ════════════════════════════════════════════════════════════
function GoalCard({ goal, onEdit }) {
  if (!goal) return (
    <button onClick={onEdit} style={{ width:"100%", padding:"14px 20px", borderRadius:18, border:"2px dashed #ddd", background:"white", color:"#ccc", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
      🐷 저축 목표 설정하기
    </button>
  );

  const pct = Math.min((goal.saved / goal.target) * 100, 100);
  const left = goal.target - goal.saved;

  return (
    <div style={{ background:"white", borderRadius:20, padding:"18px 20px", marginBottom:16, boxShadow:"0 2px 16px rgba(0,0,0,.07)", border:"2px solid #f0f0ff" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:28 }}>{goal.emoji}</span>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:"#1a1a2e" }}>{goal.title}</div>
            <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>목표 {won(goal.target)}</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:18, fontWeight:900, color:"#A29BFE" }}>{won(goal.saved)}</div>
          <div style={{ fontSize:11, color:"#bbb" }}>남은 금액 {won(left > 0 ? left : 0)}</div>
        </div>
      </div>
      <div style={{ height:10, background:"#f0f0ff", borderRadius:8, overflow:"hidden", marginBottom:6 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#A29BFE,#6C5CE7)", borderRadius:8, transition:"width 1.2s cubic-bezier(.34,1.56,.64,1)" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#aaa" }}>
        <span>{Math.round(pct)}% 달성!</span>
        <button onClick={onEdit} style={{ background:"none", border:"none", color:"#A29BFE", fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>수정 ✏️</button>
      </div>
      {pct >= 100 && <div style={{ textAlign:"center", marginTop:10, fontSize:18, animation:"pulse 1.2s infinite" }}>🎉 목표 달성! 축하해요!</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 게시물 카드
// ════════════════════════════════════════════════════════════
function PostCard({ post, profile, onLike, onDelete }) {
  const [liked, setLiked]   = useState(post.liked);
  const [heart, setHeart]   = useState(false);
  const [menu, setMenu]     = useState(false);
  const c = CAT(post.category);

  const doubleTap = () => {
    if (!liked) { setLiked(true); onLike(post.id); }
    setHeart(true); setTimeout(() => setHeart(false), 700);
  };

  return (
    <div style={{ background:"white", borderRadius:22, overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,.07)", marginBottom:18, animation:"slideUp .4s ease" }}>
      {/* 헤더 */}
      <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", overflow:"hidden", flexShrink:0, boxShadow:`0 0 0 2px white,0 0 0 3.5px ${c.color}` }}>
          {profile?.avatarUrl
            ? <img src={profile.avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,${c.color},${c.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🐰</div>
          }
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:13, color:"#1a1a2e" }}>{profile?.nickname || "나의 소비일기"}</div>
          <div style={{ fontSize:11, color:"#bbb", marginTop:1 }}>{fmtD(post.date)}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ background:`${c.color}18`, color:c.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{c.emoji} {c.label}</div>
          <button onClick={() => setMenu(v => !v)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#ccc", padding:0, lineHeight:1 }}>⋯</button>
        </div>
      </div>

      {menu && (
        <div style={{ margin:"0 16px 10px", background:"#fff5f5", borderRadius:14, border:"1px solid #ffe0e0" }}>
          <button onClick={() => { onDelete(post.id); setMenu(false); }} style={{ width:"100%", padding:"11px 16px", background:"none", border:"none", color:"#FF6B6B", fontWeight:700, cursor:"pointer", textAlign:"left", fontSize:14 }}>🗑️ 이 게시물 삭제</button>
        </div>
      )}

      {/* 이미지 */}
      <div style={{ position:"relative", cursor:"pointer" }} onDoubleClick={doubleTap}>
        {post.imageUrl
          ? <img src={post.imageUrl} alt="" style={{ width:"100%", aspectRatio:"1/1", objectFit:"cover", display:"block" }} />
          : <div style={{ width:"100%", aspectRatio:"1/1", background:`linear-gradient(135deg,${c.color}18,${c.color}44)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:80 }}>{post.sticker || c.emoji}</span>
            </div>
        }
        {heart && <div style={{ position:"absolute", top:"50%", left:"50%", fontSize:88, animation:"heartPop .7s ease forwards", pointerEvents:"none" }}>❤️</div>}
      </div>

      {/* 액션 */}
      <div style={{ padding:"11px 16px 6px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => { const n = !liked; setLiked(n); if (n) onLike(post.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:26, padding:0, transition:"transform .2s", transform: liked ? "scale(1.2)" : "scale(1)" }}>
            {liked ? "❤️" : "🤍"}
          </button>
          {post.sticker && <span style={{ fontSize:22 }}>{post.sticker}</span>}
          <div style={{ marginLeft:"auto", background:`linear-gradient(135deg,${c.color},${c.color}bb)`, color:"white", padding:"7px 18px", borderRadius:20, fontSize:16, fontWeight:900, boxShadow:`0 3px 12px ${c.color}44` }}>
            -{won(post.amount)}
          </div>
        </div>
        {post.memo && (
          <div style={{ marginTop:10, fontSize:14, color:"#333", lineHeight:1.6 }}>
            <span style={{ fontWeight:800 }}>{profile?.nickname || "나"} </span>{post.memo}
          </div>
        )}
      </div>
      <div style={{ height:14 }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 기록 추가 모달
// ════════════════════════════════════════════════════════════
function AddModal({ onClose, onAdd }) {
  const [step, setStep]   = useState(1);
  const [img, setImg]     = useState(null);
  const [amount, setAmt]  = useState("");
  const [memo, setMemo]   = useState("");
  const [cat, setCat]     = useState("food");
  const [sticker, setSt]  = useState("");
  const fileRef           = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setImg(ev.target.result); setStep(2); };
    r.readAsDataURL(f);
  };

  const submit = () => {
    if (!amount) return;
    onAdd({ id: Date.now(), date: new Date().toISOString(), imageUrl: img, amount: Number(amount), memo, category: cat, sticker, liked: false });
    onClose();
  };

  const cc = CAT(cat);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:300, display:"flex", alignItems:"flex-end", backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", width:"100%", maxWidth:430, margin:"0 auto", borderRadius:"28px 28px 0 0", padding:"20px 20px 48px", maxHeight:"92vh", overflowY:"auto", animation:"modalUp .35s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width:40, height:5, background:"#eee", borderRadius:4, margin:"0 auto 18px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:"#1a1a2e" }}>
            {step === 1 ? "📸 사진 추가" : step === 2 ? "💰 내용 입력" : "✨ 스티커 고르기"}
          </h2>
          <button onClick={onClose} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        {/* 단계 바 */}
        <div style={{ display:"flex", gap:6, marginBottom:22 }}>
          {[1,2,3].map(s => <div key={s} style={{ height:5, flex:1, borderRadius:4, background: s <= step ? "#FF6B6B" : "#eee", transition:"background .3s" }} />)}
        </div>

        {step === 1 && (
          <>
            <div onClick={() => fileRef.current.click()} style={{ border:"2px dashed #e0e0e0", borderRadius:20, aspectRatio:"1/1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:14, background:"#fafafa" }}>
              <span style={{ fontSize:56 }}>📷</span>
              <span style={{ color:"#bbb", fontSize:14 }}>탭해서 사진 선택 / 카메라 촬영</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
            <button onClick={() => setStep(2)} style={{ width:"100%", marginTop:12, padding:14, borderRadius:16, border:"none", background:"#f5f5f5", color:"#bbb", fontSize:14, cursor:"pointer", fontWeight:700 }}>
              사진 없이 계속하기 →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {img && <img src={img} alt="" style={{ width:"100%", aspectRatio:"1/1", objectFit:"cover", borderRadius:18, marginBottom:16 }} />}

            <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>카테고리</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
              {CATEGORIES.map(cc => (
                <button key={cc.id} onClick={() => setCat(cc.id)} style={{ padding:"6px 13px", borderRadius:20, border:`2px solid ${cat === cc.id ? cc.color : "#eee"}`, background: cat === cc.id ? `${cc.color}18` : "white", color: cat === cc.id ? cc.color : "#aaa", fontSize:12, fontWeight:700, cursor:"pointer", transition:"all .2s" }}>
                  {cc.emoji} {cc.label}
                </button>
              ))}
            </div>

            <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>얼마 썼어요?</label>
            <div style={{ display:"flex", alignItems:"center", background:"#f8f8f8", borderRadius:16, padding:"0 18px", marginBottom:18 }}>
              <span style={{ fontSize:20, fontWeight:900, color:cc.color }}>₩</span>
              <input type="number" placeholder="0" value={amount} onChange={e => setAmt(e.target.value)}
                style={{ flex:1, border:"none", background:"none", padding:"14px 8px", fontSize:28, fontWeight:900, color:"#1a1a2e", outline:"none" }} />
            </div>

            <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>어떤 걸 샀어요?</label>
            <textarea placeholder="오늘 이걸 샀어요 😊" value={memo} onChange={e => setMemo(e.target.value)} rows={2}
              style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:16, padding:"13px 16px", fontSize:14, resize:"none", outline:"none", boxSizing:"border-box", marginBottom:20 }} />

            <button onClick={() => setStep(3)} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", color:"white", fontSize:16, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px rgba(255,107,107,.4)" }}>
              다음 →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <p style={{ textAlign:"center", color:"#aaa", fontSize:14, marginBottom:20 }}>스티커를 골라 게시물을 꾸며봐요!</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:28 }}>
              {STICKERS.map(s => (
                <button key={s} onClick={() => setSt(s)} style={{ fontSize:28, background: sticker === s ? "#fff0f0" : "#fafafa", border:`2px solid ${sticker === s ? "#FF6B6B" : "transparent"}`, borderRadius:14, padding:"8px 0", cursor:"pointer", transition:"all .15s", transform: sticker === s ? "scale(1.18)" : "scale(1)" }}>{s}</button>
              ))}
            </div>
            <button onClick={submit} disabled={!amount} style={{ width:"100%", padding:16, borderRadius:18, border:"none", background: amount ? "linear-gradient(135deg,#FF6B6B,#FF8E53)" : "#eee", color: amount ? "white" : "#bbb", fontSize:16, fontWeight:900, cursor: amount ? "pointer" : "not-allowed", boxShadow: amount ? "0 4px 16px rgba(255,107,107,.4)" : "none", transition:"all .3s" }}>
              🎉 게시하기!
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 예산 설정 모달
// ════════════════════════════════════════════════════════════
function BudgetModal({ budget, onSave, onClose }) {
  const [val, setVal] = useState(budget > 0 ? String(budget) : "");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", padding:24 }}>
      <div style={{ background:"white", borderRadius:28, padding:28, width:"100%", maxWidth:360, animation:"slideUp .3s ease" }}>
        <h2 style={{ margin:"0 0 6px", fontWeight:900, color:"#1a1a2e" }}>💵 이번 달 예산 설정</h2>
        <p style={{ color:"#aaa", fontSize:13, marginBottom:20 }}>부모님께 받은 이번 달 용돈 총액을 입력해요.</p>
        <div style={{ display:"flex", alignItems:"center", background:"#f8f8f8", borderRadius:16, padding:"0 18px", marginBottom:22 }}>
          <span style={{ fontSize:20, fontWeight:900, color:"#FF6B6B" }}>₩</span>
          <input type="number" placeholder="예: 50000" value={val} onChange={e => setVal(e.target.value)} autoFocus
            onKeyDown={e => e.key === "Enter" && val && onSave(Number(val))}
            style={{ flex:1, border:"none", background:"none", padding:"14px 8px", fontSize:26, fontWeight:900, color:"#1a1a2e", outline:"none" }} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:14, borderRadius:16, border:"2px solid #eee", background:"white", color:"#aaa", fontSize:14, cursor:"pointer", fontWeight:700 }}>취소</button>
          <button onClick={() => val && onSave(Number(val))} disabled={!val} style={{ flex:2, padding:14, borderRadius:16, border:"none", background: val ? "linear-gradient(135deg,#FF6B6B,#FF8E53)" : "#eee", color: val ? "white" : "#bbb", fontSize:14, fontWeight:900, cursor: val ? "pointer" : "not-allowed", boxShadow: val ? "0 4px 14px rgba(255,107,107,.35)" : "none" }}>
            저장하기 ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 저축 목표 모달
// ════════════════════════════════════════════════════════════
const GOAL_EMOJIS = ["🎮","👟","🎒","📱","🍰","🐶","✈️","📚","🎸","💄","🎠","⭐"];
function GoalModal({ goal, onSave, onClose }) {
  const [title,  setTitle]  = useState(goal?.title  || "");
  const [target, setTarget] = useState(goal?.target ? String(goal.target) : "");
  const [saved,  setSaved]  = useState(goal?.saved  ? String(goal.saved)  : "");
  const [emoji,  setEmoji]  = useState(goal?.emoji  || "🎮");

  const submit = () => {
    if (!title || !target) return;
    onSave({ title, target: Number(target), saved: Number(saved) || 0, emoji });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", padding:24 }}>
      <div style={{ background:"white", borderRadius:28, padding:28, width:"100%", maxWidth:360, animation:"slideUp .3s ease" }}>
        <h2 style={{ margin:"0 0 6px", fontWeight:900, color:"#1a1a2e" }}>🐷 저축 목표 설정</h2>
        <p style={{ color:"#aaa", fontSize:13, marginBottom:18 }}>무엇을 위해 모으고 있나요?</p>

        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:8 }}>이모지 선택</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:18 }}>
          {GOAL_EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)} style={{ fontSize:24, background: emoji === e ? "#f0f0ff" : "#fafafa", border:`2px solid ${emoji === e ? "#A29BFE" : "transparent"}`, borderRadius:12, padding:"6px 0", cursor:"pointer", transition:"all .15s" }}>{e}</button>
          ))}
        </div>

        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>목표 이름</label>
        <input placeholder="예: 닌텐도 게임 사기" value={title} onChange={e => setTitle(e.target.value)} maxLength={20}
          style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"12px 16px", fontSize:15, outline:"none", marginBottom:14, boxSizing:"border-box" }} />

        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>목표 금액 (₩)</label>
        <input type="number" placeholder="예: 60000" value={target} onChange={e => setTarget(e.target.value)}
          style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"12px 16px", fontSize:15, outline:"none", marginBottom:14, boxSizing:"border-box" }} />

        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>지금까지 모은 금액 (₩)</label>
        <input type="number" placeholder="예: 15000" value={saved} onChange={e => setSaved(e.target.value)}
          style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"12px 16px", fontSize:15, outline:"none", marginBottom:22, boxSizing:"border-box" }} />

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:14, borderRadius:16, border:"2px solid #eee", background:"white", color:"#aaa", fontSize:14, cursor:"pointer", fontWeight:700 }}>취소</button>
          <button onClick={submit} disabled={!title || !target} style={{ flex:2, padding:14, borderRadius:16, border:"none", background: title && target ? "linear-gradient(135deg,#A29BFE,#6C5CE7)" : "#eee", color: title && target ? "white" : "#bbb", fontSize:14, fontWeight:900, cursor: title && target ? "pointer" : "not-allowed" }}>
            저장하기 ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 통계 탭
// ════════════════════════════════════════════════════════════
function StatsTab({ posts }) {
  const mp    = posts.filter(p => thisMonth(p.date));
  const total = mp.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div style={{ background:"white", borderRadius:22, padding:22, marginBottom:16, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin:"0 0 4px", fontWeight:900, fontSize:15, color:"#1a1a2e" }}>📊 이번 달 카테고리별 지출</h3>
        <p style={{ margin:"0 0 18px", fontSize:12, color:"#bbb" }}>총 {won(total)}</p>
        {CATEGORIES.map(cc => {
          const t   = mp.filter(p => p.category === cc.id).reduce((s, p) => s + p.amount, 0);
          const pct = total > 0 ? (t / total * 100) : 0;
          return (
            <div key={cc.id} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:13, fontWeight:700 }}>{cc.emoji} {cc.label}</span>
                <span style={{ fontSize:13, fontWeight:900, color:cc.color }}>{won(t)}</span>
              </div>
              <div style={{ height:10, background:"#f4f4f8", borderRadius:8, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${cc.color},${cc.color}88)`, borderRadius:8, transition:"width .8s ease" }} />
              </div>
              <div style={{ fontSize:11, color:"#ccc", marginTop:3 }}>{Math.round(pct)}%</div>
            </div>
          );
        })}
      </div>

      <div style={{ background:"white", borderRadius:22, padding:22, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin:"0 0 16px", fontWeight:900, fontSize:15, color:"#1a1a2e" }}>🕐 전체 기록</h3>
        {posts.length === 0
          ? <div style={{ textAlign:"center", padding:"30px 0", color:"#ddd", fontSize:14 }}>기록이 없어요</div>
          : posts.map(p => {
              const c = CAT(p.category);
              return (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, paddingBottom:14, borderBottom:"1px solid #f8f8f8" }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:`${c.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                    {p.sticker || c.emoji}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.memo || "기록 없음"}</div>
                    <div style={{ fontSize:11, color:"#bbb", marginTop:2 }}>{fmtD(p.date)} · {c.label}</div>
                  </div>
                  <div style={{ fontWeight:900, color:c.color, fontSize:14, flexShrink:0 }}>-{won(p.amount)}</div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 프로필 탭
// ════════════════════════════════════════════════════════════
function ProfileTab({ profile, posts, onEdit }) {
  const total = posts.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      {/* 프로필 헤더 */}
      <div style={{ background:"white", borderRadius:22, padding:"28px 22px 22px", marginBottom:16, boxShadow:"0 2px 16px rgba(0,0,0,.06)", textAlign:"center" }}>
        <div style={{ width:88, height:88, borderRadius:"50%", overflow:"hidden", margin:"0 auto 14px", boxShadow:"0 0 0 3px white,0 0 0 5px #FF6B6B" }}>
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>🐰</div>
          }
        </div>
        <div style={{ fontSize:20, fontWeight:900, color:"#1a1a2e", marginBottom:6 }}>{profile.nickname}</div>
        {profile.bio && <div style={{ fontSize:14, color:"#888", marginBottom:16 }}>{profile.bio}</div>}

        <div style={{ display:"flex", justifyContent:"center", gap:36, marginBottom:20 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:900, color:"#1a1a2e" }}>{posts.length}</div>
            <div style={{ fontSize:11, color:"#bbb" }}>기록</div>
          </div>
          <div style={{ width:1, background:"#f0f0f0" }} />
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:900, color:"#FF6B6B" }}>{won(total)}</div>
            <div style={{ fontSize:11, color:"#bbb" }}>총 지출</div>
          </div>
        </div>

        <button onClick={onEdit} style={{ padding:"10px 28px", borderRadius:20, border:"2px solid #eee", background:"white", color:"#666", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          ✏️ 프로필 수정
        </button>
      </div>

      {/* 게시물 그리드 */}
      <div style={{ background:"white", borderRadius:22, padding:16, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin:"0 0 14px", fontWeight:900, fontSize:15, color:"#1a1a2e" }}>📸 내 게시물</h3>
        {posts.length === 0
          ? <div style={{ textAlign:"center", padding:"30px 0", color:"#ddd" }}>
              <div style={{ fontSize:40 }}>📷</div>
              <div style={{ marginTop:8, fontSize:14 }}>아직 기록이 없어요</div>
            </div>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:3 }}>
              {posts.map(p => {
                const c = CAT(p.category);
                return (
                  <div key={p.id} style={{ aspectRatio:"1/1", borderRadius:8, overflow:"hidden", background:`${c.color}22` }}>
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{p.sticker || c.emoji}</div>
                    }
                  </div>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 프로필 수정 모달
// ════════════════════════════════════════════════════════════
function ProfileEditModal({ profile, onSave, onClose }) {
  const [nick,   setNick]   = useState(profile.nickname || "");
  const [bio,    setBio]    = useState(profile.bio || "");
  const [avatar, setAvatar] = useState(profile.avatarUrl || null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setAvatar(ev.target.result);
    r.readAsDataURL(f);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:300, display:"flex", alignItems:"flex-end", backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", width:"100%", maxWidth:430, margin:"0 auto", borderRadius:"28px 28px 0 0", padding:"20px 24px 48px", animation:"modalUp .35s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width:40, height:5, background:"#eee", borderRadius:4, margin:"0 auto 20px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:"#1a1a2e" }}>✏️ 프로필 수정</h2>
          <button onClick={onClose} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div onClick={() => fileRef.current.click()} style={{ position:"relative", cursor:"pointer" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", overflow:"hidden", boxShadow:"0 4px 16px rgba(255,107,107,.3)" }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🐰</div>
              }
            </div>
            <div style={{ position:"absolute", bottom:0, right:0, width:26, height:26, background:"#FF6B6B", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid white", fontSize:13 }}>📷</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
        </div>

        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>닉네임</label>
        <input maxLength={10} value={nick} onChange={e => setNick(e.target.value)}
          style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"13px 16px", fontSize:16, fontWeight:700, outline:"none", marginBottom:16, boxSizing:"border-box" }} />

        <label style={{ display:"block", fontSize:11, fontWeight:800, color:"#bbb", letterSpacing:".06em", marginBottom:6 }}>한 줄 소개</label>
        <input maxLength={30} value={bio} onChange={e => setBio(e.target.value)} placeholder="30자 이내"
          style={{ width:"100%", border:"none", background:"#f8f8f8", borderRadius:14, padding:"13px 16px", fontSize:14, outline:"none", marginBottom:24, boxSizing:"border-box" }} />

        <button onClick={() => nick.trim() && onSave({ ...profile, nickname: nick.trim(), bio: bio.trim(), avatarUrl: avatar })} disabled={!nick.trim()}
          style={{ width:"100%", padding:16, borderRadius:18, border:"none", background: nick.trim() ? "linear-gradient(135deg,#FF6B6B,#FF8E53)" : "#eee", color: nick.trim() ? "white" : "#bbb", fontSize:16, fontWeight:900, cursor: nick.trim() ? "pointer" : "not-allowed", boxShadow: nick.trim() ? "0 4px 16px rgba(255,107,107,.4)" : "none" }}>
          저장하기 ✓
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 앱 루트
// ════════════════════════════════════════════════════════════
export default function App() {
  const [profile,  setProfile]  = useState(() => LS.get("yd_profile"));
  const [posts,    setPosts]    = useState(() => LS.get("yd_posts", []));
  const [budget,   setBudget]   = useState(() => LS.get("yd_budget", 0));
  const [goal,     setGoal]     = useState(() => LS.get("yd_goal", null));
  const [tab,      setTab]      = useState("feed");
  const [showAdd,  setShowAdd]  = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showGoal,   setShowGoal]   = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  useEffect(() => { LS.set("yd_profile", profile); }, [profile]);
  useEffect(() => { LS.set("yd_posts",   posts);   }, [posts]);
  useEffect(() => { LS.set("yd_budget",  budget);  }, [budget]);
  useEffect(() => { LS.set("yd_goal",    goal);    }, [goal]);

  const handleAdd    = useCallback(p  => setPosts(prev => [p, ...prev]), []);
  const handleLike   = useCallback(id => setPosts(prev => prev.map(p => p.id === id ? {...p, liked:true} : p)), []);
  const handleDelete = useCallback(id => { if (window.confirm("이 게시물을 삭제할까요?")) setPosts(prev => prev.filter(p => p.id !== id)); }, []);

  // 온보딩
  if (!profile) return (
    <>
      <style>{G}</style>
      <Onboarding onDone={p => setProfile(p)} />
    </>
  );

  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"#f4f4f8", fontFamily:"'Noto Sans KR',sans-serif" }}>
      <style>{G}</style>

      {/* ── 상단 바 ── */}
      <div style={{ padding:"14px 18px 10px", background:"white", borderBottom:"1px solid #f0f0f0", position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:900, color:"#1a1a2e", letterSpacing:"-.5px" }}>💰 용돈일기</div>
          <div style={{ fontSize:10, color:"#FF6B6B", fontWeight:700, marginTop:1 }}>나만의 소비 피드</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B6B,#FF8E53)", border:"none", cursor:"pointer", fontSize:24, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(255,107,107,.4)", color:"white", fontWeight:900 }}>+</button>
      </div>

      {/* ── 탭 바 ── */}
      <div style={{ display:"flex", background:"white", borderBottom:"1px solid #f0f0f0", position:"sticky", top:58, zIndex:99 }}>
        {[["feed","🏠 홈"],["stats","📊 통계"],["profile","👤 프로필"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:"11px 0", border:"none", background:"none", cursor:"pointer", fontSize:12, fontWeight:700, color: tab === id ? "#FF6B6B" : "#bbb", borderBottom: tab === id ? "2.5px solid #FF6B6B" : "2.5px solid transparent", transition:"all .2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── 본문 ── */}
      <div style={{ padding:"16px 14px 100px" }}>
        {tab === "feed" && (
          <>
            <BudgetCard budget={budget} posts={posts} onEdit={() => setShowBudget(true)} />
            <GoalCard   goal={goal}               onEdit={() => setShowGoal(true)} />
            {posts.length === 0
              ? <div style={{ textAlign:"center", padding:"50px 0", color:"#ccc" }}>
                  <div style={{ fontSize:56 }}>📷</div>
                  <div style={{ marginTop:12, fontSize:15, fontWeight:700 }}>첫 번째 소비를 기록해봐요!</div>
                  <div style={{ marginTop:6, fontSize:13 }}>위 + 버튼을 눌러보세요 😊</div>
                </div>
              : posts.map(p => <PostCard key={p.id} post={p} profile={profile} onLike={handleLike} onDelete={handleDelete} />)
            }
          </>
        )}
        {tab === "stats"   && <StatsTab   posts={posts} budget={budget} />}
        {tab === "profile" && <ProfileTab profile={profile} posts={posts} onEdit={() => setShowProfileEdit(true)} />}
      </div>

      {/* ── 모달 ── */}
      {showAdd          && <AddModal           onClose={() => setShowAdd(false)}           onAdd={handleAdd} />}
      {showBudget       && <BudgetModal        budget={budget}   onSave={n  => { setBudget(n);    setShowBudget(false);      }} onClose={() => setShowBudget(false)} />}
      {showGoal         && <GoalModal          goal={goal}       onSave={g  => { setGoal(g);      setShowGoal(false);        }} onClose={() => setShowGoal(false)} />}
      {showProfileEdit  && <ProfileEditModal   profile={profile} onSave={p  => { setProfile(p);  setShowProfileEdit(false); }} onClose={() => setShowProfileEdit(false)} />}
    </div>
  );
}
