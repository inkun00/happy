import { NavLink } from "react-router-dom";

const linkBase =
  "flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
const inactive = `${linkBase} text-primary opacity-60 hover:opacity-100 ${focusRing}`;
const activeCls = `${linkBase} rounded-full bg-primary-container text-surface shadow-sm ${focusRing}`;

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full justify-around rounded-t-xl bg-surface/80 px-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-4 backdrop-blur-xl shadow-nav"
      aria-label="주요 메뉴"
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? activeCls : inactive)}
      >
        {({ isActive }) => (
          <>
            <span
              className="material-symbols-outlined mb-1"
              style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
            >
              home
            </span>
            <span className="font-label text-[12px] font-medium">홈</span>
          </>
        )}
      </NavLink>
      <NavLink
        to="/missions"
        className={({ isActive }) => (isActive ? activeCls : inactive)}
      >
        {({ isActive }) => (
          <>
            <span
              className="material-symbols-outlined mb-1"
              style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
            >
              task_alt
            </span>
            <span className="font-label text-[12px] font-medium">미션</span>
          </>
        )}
      </NavLink>
      <NavLink
        to="/shop"
        className={({ isActive }) => (isActive ? activeCls : inactive)}
      >
        {({ isActive }) => (
          <>
            <span
              className="material-symbols-outlined mb-1"
              style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
            >
              redeem
            </span>
            <span className="font-label text-[12px] font-medium">상점</span>
          </>
        )}
      </NavLink>
      <NavLink
        to="/profile"
        className={({ isActive }) => (isActive ? activeCls : inactive)}
      >
        {({ isActive }) => (
          <>
            <span
              className="material-symbols-outlined mb-1"
              style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
            >
              person
            </span>
            <span className="font-label text-[12px] font-medium">프로필</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
