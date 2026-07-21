export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 anim-scale-in"
            style={{background:"linear-gradient(135deg,#c9184a,#ff758f)",boxShadow:"0 6px 20px rgba(201,24,74,.3),inset 0 1px 0 rgba(255,255,255,.22)"}}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text anim-fade-up d-100">جیم‌اپ</h1>
        </div>

        <div className="glass-strong p-7 anim-scale-in d-50">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-5 mx-auto anim-scale-in d-100"
            style={{background:"rgba(79,110,247,.12)",border:"1px solid rgba(79,110,247,.2)"}}>
            <svg className="w-5 h-5" style={{color:"#7b96fa"}} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-base font-bold mb-1 text-center anim-fade-up d-150">بازیابی رمز عبور</h2>
          <p className="text-xs mb-5 text-center anim-fade-in d-200" style={{color:"rgba(255,255,255,.38)"}}>
            شماره تلفن خود را وارد کنید تا کد بازیابی ارسال شود
          </p>

          <form className="space-y-3" action="/api/auth/forgot-password" method="POST">
            <div className="anim-fade-up d-200 text-right">
              <label className="block text-[10px] font-semibold mb-1.5" style={{color:"rgba(255,255,255,.38)"}}>شماره تلفن</label>
              <input name="phone" type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr"
                className="input-glass w-full rounded-xl px-3.5 py-3 text-sm text-right focus:text-left"/>
            </div>
            <div className="anim-fade-up d-300">
              <button type="submit" className="btn-primary w-full rounded-xl py-3 text-sm font-bold mt-2">
                ارسال کد بازیابی
              </button>
            </div>
          </form>

          <a href="/sign-in" className="block text-center text-xs mt-4 anim-fade-in d-400 transition-colors hover:text-white"
            style={{color:"rgba(255,255,255,.38)"}}>
            بازگشت به صفحه ورود ←
          </a>
        </div>
      </div>
    </div>
  );
}
