// Marka renginde özgün flat illüstrasyon — temizlik profesyoneli.
// Gerçek fotoğraf ile değiştirmek istenirse bu bileşen kaldırılıp next/image konur.
export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      className={className}
      role="img"
      aria-label="Geprüfte Reinigungskraft von PutzPilot"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* arka plan disk */}
      <circle cx="240" cy="182" r="150" fill="#1a1a1a" opacity="0.06" />
      <circle cx="240" cy="176" r="146" fill="#fff" />

      {/* sparkle yıldızlar */}
      <g fill="#1a1a1a">
        <path d="M96 92l6 16 16 6-16 6-6 16-6-16-16-6 16-6z" />
        <path d="M382 214l4.5 12 12 4.5-12 4.5-4.5 12-4.5-12-12-4.5 12-4.5z" opacity="0.85" />
      </g>
      <g fill="#d99e00">
        <path d="M372 96l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" />
        <path d="M104 244l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" opacity="0.9" />
      </g>

      {/* zemin gölge */}
      <ellipse cx="240" cy="304" rx="96" ry="16" fill="#1a1a1a" opacity="0.08" />

      {/* --- karakter --- */}
      {/* bacaklar */}
      <rect x="212" y="248" width="20" height="56" rx="10" fill="#2b2b2b" />
      <rect x="248" y="248" width="20" height="56" rx="10" fill="#2b2b2b" />
      {/* ayakkabılar */}
      <rect x="204" y="296" width="30" height="14" rx="7" fill="#1a1a1a" />
      <rect x="246" y="296" width="30" height="14" rx="7" fill="#1a1a1a" />

      {/* gövde + önlük */}
      <path
        d="M198 176c0-24 19-42 42-42s42 18 42 42v58c0 12-9 20-21 20h-42c-12 0-21-8-21-20z"
        fill="#f5b301"
      />
      {/* önlük beyazı */}
      <path
        d="M222 158h36c6 0 10 5 9 11l-9 74c-1 6-5 9-11 9h-14c-6 0-10-3-11-9l-9-74c-1-6 3-11 9-11z"
        fill="#fff"
      />
      <path d="M240 160v92" stroke="#1a1a1a" strokeWidth="2" opacity="0.12" />

      {/* sol kol + sarı eldiven (aşağıda) */}
      <path d="M204 190c-14 6-22 20-22 36" fill="none" stroke="#f5b301" strokeWidth="18" strokeLinecap="round" />
      <circle cx="182" cy="228" r="12" fill="#f5b301" stroke="#d99e00" strokeWidth="3" />

      {/* sağ kol sprey şişesini tutuyor */}
      <path d="M276 188c16 2 30 10 40 24" fill="none" stroke="#f5b301" strokeWidth="18" strokeLinecap="round" />
      <circle cx="318" cy="214" r="12" fill="#f5b301" stroke="#d99e00" strokeWidth="3" />

      {/* sprey şişesi */}
      <g>
        <rect x="322" y="196" width="26" height="40" rx="6" fill="#1a1a1a" />
        <rect x="328" y="204" width="14" height="16" rx="2" fill="#f5b301" />
        <path d="M330 196v-8h14l6 -6v10z" fill="#2b2b2b" />
        <path d="M344 184l14-4M344 190l14 2" stroke="#d99e00" strokeWidth="3" strokeLinecap="round" />
        {/* sprey damlacıkları */}
        <g fill="#16a34a">
          <circle cx="366" cy="176" r="3" />
          <circle cx="374" cy="186" r="2.4" />
          <circle cx="362" cy="190" r="2" />
        </g>
      </g>

      {/* baş */}
      <circle cx="240" cy="120" r="30" fill="#f4c9a3" />
      {/* saç */}
      <path d="M210 118c0-20 14-34 30-34s30 14 30 34c0-8-6-12-12-12h-36c-6 0-12 4-12 12z" fill="#1a1a1a" />
      <path d="M210 118c0 8 3 14 6 18l2-24z" fill="#1a1a1a" />
      <path d="M270 118c0 8-3 14-6 18l-2-24z" fill="#1a1a1a" />
      {/* yüz */}
      <circle cx="230" cy="120" r="2.6" fill="#1a1a1a" />
      <circle cx="250" cy="120" r="2.6" fill="#1a1a1a" />
      <path d="M232 130c4 4 12 4 16 0" fill="none" stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />
      {/* yanak */}
      <g fill="#f5b301" opacity="0.4">
        <circle cx="224" cy="127" r="4" />
        <circle cx="256" cy="127" r="4" />
      </g>

      {/* rozet: doğrulanmış (kalp/kalkan yerine onay) */}
      <g transform="translate(150 150)">
        <circle cx="0" cy="0" r="16" fill="#16a34a" />
        <path d="M-7 0l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
