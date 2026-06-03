// ════════════════════════════════════════════════════════════
// 메인 앱 (수정 완료 버전)
// ════════════════════════════════════════════════════════════
export default function App() {
  // 통계 공유 링크로 접근한 경우
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

  useEffect(() => { LS.set("yd_profile", profile); }, [profile]);
  useEffect(() => { LS.set("yd_posts",   posts);   }, [posts]);
  useEffect(() => { LS.set("yd_wallet",  wallet);  }, [wallet]);
  useEffect(() => { LS.set("yd_goal",    goal);    }, [goal]);

  // 1. 게시물 추가 시 잔액 반영
  const handleAdd = useCallback(p => {
    setPosts(prev => [p, ...prev]);
    setWallet(prev => { 
      const n={...prev}; 
      if(p.type==="income"){
        if(p.payMethod==="card") n.card=(n.card||0)+p.amount;
        else n.cash=(n.cash||0)+p.amount;
      }else{
        if(p.payMethod==="card") n.card=Math.max(0,(n.card||0)-p.amount);
        else n.cash=Math.max(0,(n.cash||0)-p.amount);
      } 
      return n; 
    });
  }, []);

  const handleEdit = useCallback(p => setEditPost(p), []);

  // 2. 게시물 수정 시 잔액 반영 (★수정됨)
  const handleSaveEdit = useCallback(updated => {
    setPosts(prev => {
      const oldPost = prev.find(p => p.id === updated.id);
      if (!oldPost) return prev;

      setWallet(walletPrev => {
        const n = { ...walletPrev };

        // [단계 1] 수정 전 예전 금액 지갑에서 원상복구(취소) 하기
        if (oldPost.type === "income") {
          if (oldPost.payMethod === "card") n.card = Math.max(0, (n.card || 0) - oldPost.amount);
          else n.cash = Math.max(0, (n.cash || 0) - oldPost.amount);
        } else {
          if (oldPost.payMethod === "card") n.card = (n.card || 0) + oldPost.amount;
          else n.cash = (n.cash || 0) + oldPost.amount;
        }

        // [단계 2] 새롭게 수정한 금액 지갑에 적용하기
        if (updated.type === "income") {
          if (updated.payMethod === "card") n.card = (n.card || 0) + updated.amount;
          else n.cash = (n.cash || 0) + updated.amount;
        } else {
          if (updated.payMethod === "card") n.card = Math.max(0, (n.card || 0) - updated.amount);
          else n.cash = Math.max(0, (n.cash || 0) - updated.amount);
        }

        return n;
      });

      return prev.map(p => p.id === updated.id ? updated : p);
    });
  }, []);

  const handleLike = useCallback(id => setPosts(prev => prev.map(p => p.id===id?{...p,liked:true}:p)), []);

  // 3. 게시물 삭제 시 잔액 반영 (★수정됨)
  const handleDelete = useCallback(id => {
    if (window.confirm("이 게시물을 삭제할까요?")) {
      setPosts(prev => {
        const targetPost = prev.find(p => p.id === id);
        if (!targetPost) return prev;

        setWallet(walletPrev => {
          const n = { ...walletPrev };

          // 돈을 썼던 걸 지우면 잔액을 늘려주고, 받았던 걸 지우면 잔액을 줄여줌
          if (targetPost.type === "income") {
            if (targetPost.payMethod === "card") n.card = Math.max(0, (n.card || 0) - targetPost.amount);
            else n.cash = Math.max(0, (n.cash || 0) - targetPost.amount);
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
