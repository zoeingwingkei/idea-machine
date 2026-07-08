import svgPaths from "./svg-xhyhfau3vr";

function Title() {
  return (
    <div className="content-stretch flex gap-[7.5px] items-start justify-center relative shrink-0" data-name="title">
      <div className="h-[15.96px] relative shrink-0 w-[62.924px]" data-name="R">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62.9243 15.96">
          <path d={svgPaths.p23e4f00} fill="var(--fill-0, black)" id="R" />
        </svg>
      </div>
      <p className="[word-break:break-word] font-['Limelight:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[15px] text-black whitespace-nowrap">YOUR IDEA</p>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[15.96px] relative w-[62.924px]" data-name="R">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62.9243 15.96">
              <path d={svgPaths.p23e4f00} fill="var(--fill-0, black)" id="R" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ticket() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[4px] items-center justify-center left-1/2 overflow-clip px-[24px] py-[16px] rounded-[1.25px] top-[6px] w-[500px]" data-name="Ticket">
      <div className="absolute h-[187.5px] left-0 top-0 w-[500px]" data-name="ticket-background">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 500 187.5">
          <path d={svgPaths.p4a02280} fill="var(--fill-0, #EECC6D)" id="ticket-background" />
        </svg>
      </div>
      <Title />
      <p className="[word-break:break-word] font-['Playfair_Display:Regular',sans-serif] font-normal leading-[0] min-w-full relative shrink-0 text-[0px] text-black text-center w-[min-content]">
        <span className="font-['Playfair_Display:Italic',sans-serif] italic leading-[normal] text-[20px]">A</span>
        <span className="font-['Playfair_Display:Italic',sans-serif] italic leading-[normal] text-[20px]">{` `}</span>
        <span className="font-['Playfair_Display:Bold',sans-serif] font-bold leading-[normal] text-[20px]">Subscription Service</span>
        <span className="leading-[normal] text-[20px]">{` `}</span>
        <span className="font-['Playfair_Display:Italic',sans-serif] italic leading-[normal] text-[20px]">for</span>
        <span className="leading-[normal] text-[20px]">{` `}</span>
        <span className="font-['Playfair_Display:Bold',sans-serif] font-bold leading-[normal] text-[20px]">{`Loss & Grief `}</span>
        <span className="leading-[normal] text-[20px]">{`— `}</span>
        <span className="font-['Playfair_Display:Bold',sans-serif] font-bold leading-[normal] text-[20px]">Lifetime Price for First 100.</span>
      </p>
    </div>
  );
}

export default function Output() {
  return (
    <div className="bg-[rgba(255,255,255,0.08)] relative size-full" data-name="output">
      <div aria-hidden className="absolute border-4 border-solid border-white inset-[-4px] pointer-events-none" />
      <Ticket />
    </div>
  );
}