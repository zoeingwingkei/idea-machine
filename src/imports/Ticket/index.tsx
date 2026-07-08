import svgPaths from "./svg-gvnuw6348n";

function Title() {
  return (
    <div className="content-stretch flex gap-[24px] items-start justify-center relative shrink-0" data-name="title">
      <div className="h-[51.072px] relative shrink-0 w-[201.358px]" data-name="R">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62.9243 15.96">
          <path d={svgPaths.p23e4f00} fill="var(--fill-0, black)" id="R" />
        </svg>
      </div>
      <p className="[word-break:break-word] font-['Limelight:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[48px] text-black whitespace-nowrap">YOUR IDEA</p>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[51.072px] relative w-[201.358px]" data-name="R">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62.9243 15.96">
              <path d={svgPaths.p23e4f00} fill="var(--fill-0, black)" id="R" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Ticket() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center overflow-clip px-[72px] py-[56px] relative rounded-[4px] size-full" data-name="Ticket">
      <div className="absolute h-[600px] left-0 top-0 w-[1600px]" data-name="ticket-background">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 500 187.5">
          <path d={svgPaths.p4a02280} fill="var(--fill-0, #EECC6D)" id="ticket-background" />
        </svg>
      </div>
      <Title />
      <p className="[word-break:break-word] font-['Playfair_Display:Regular',sans-serif] font-normal leading-[0] min-w-full relative shrink-0 text-[0px] text-black text-center w-[min-content]">
        <span className="font-['Playfair_Display:Italic',sans-serif] italic leading-[normal] text-[64px]">A</span>
        <span className="font-['Playfair_Display:Italic',sans-serif] italic leading-[normal] text-[64px]">{` `}</span>
        <span className="font-['Playfair_Display:Bold',sans-serif] font-bold leading-[normal] text-[64px]">Subscription Service</span>
        <span className="leading-[normal] text-[64px]">{` `}</span>
        <span className="font-['Playfair_Display:Italic',sans-serif] italic leading-[normal] text-[64px]">for</span>
        <span className="leading-[normal] text-[64px]">{` `}</span>
        <span className="font-['Playfair_Display:Bold',sans-serif] font-bold leading-[normal] text-[64px]">{`Loss & Grief `}</span>
        <span className="leading-[normal] text-[64px]">{`— `}</span>
        <span className="font-['Playfair_Display:Bold',sans-serif] font-bold leading-[normal] text-[64px]">Lifetime Price for First 100.</span>
      </p>
    </div>
  );
}