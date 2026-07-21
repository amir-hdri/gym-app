export default function SignUpPage() {
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
          <p className="text-xs mt-1.5 anim-fade-in d-200" style={{color:"rgba(255,255,255,.38)"}}>ایجاد حساب کاربری جدید</p>
        </div>

        <div className="glass-strong p-7 anim-scale-in d-50">
          <h2 className="text-base font-bold mb-1 anim-fade-up d-150">ثبت نام</h2>
          <p className="text-xs mb-5 anim-fade-in d-200" style={{color:"rgba(255,255,255,.38)"}}>مشخصات خود را برای شروع وارد کنید</p>

          <form className="space-y-3.5" action="/api/auth/register" method="POST">
            {[
              {name:"name",     type:"text",     label:"نام و نام خانوادگی",     placeholder:"سارا محمدی", dir:"rtl"},
              {name:"phone",    type:"tel",      label:"شماره تلفن",  placeholder:"۰۹۱۲۳۴۵۶۷۸۹", dir:"ltr"},
              {name:"email",    type:"email",    label:"ایمیل (اختیاری)",  placeholder:"sara@example.com", dir:"ltr"},
              {name:"password", type:"password", label:"رمز عبور",      placeholder:"حداقل ۸ کاراکتر", dir:"ltr"},
            ].map((f,i) => (
              <div key={f.name} className="anim-fade-up" style={{animationDelay:`${150+i*60}ms`}}>
                <label className="block text-[10px] font-semibold mb-1.5 text-right" style={{color:"rgba(255,255,255,.38)"}}>{f.label}</label>
                <input name={f.name} type={f.type} placeholder={f.placeholder} dir={f.dir}
                  className={`input-glass w-full rounded-xl px-3.5 py-3 text-sm ${f.dir === "rtl" ? "text-right" : "text-left"}`}/>
              </div>
            ))}
            <div className="anim-fade-up d-400">
              <button type="submit" className="btn-primary w-full rounded-xl py-3 text-sm font-bold mt-2">
                ایجاد حساب کاربری
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
