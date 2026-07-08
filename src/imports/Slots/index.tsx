import svgPaths from "./svg-tflfnq3wub";

function Slot() {
  return (
    <div className="flex-[1_0_0] h-[112.5px] min-w-px relative" data-name="slot-1">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[15px] pr-[22.5px] py-[3.125px] relative size-full">
          <p className="[word-break:break-word] flex-[1_0_0] font-['Arvo:Bold',sans-serif] leading-[normal] min-w-px not-italic relative text-[#1e1e1e] text-[20px] text-center">Subscription Service</p>
        </div>
      </div>
    </div>
  );
}

function Slot1() {
  return (
    <div className="flex-[1_0_0] h-[112.5px] min-w-px relative" data-name="slot-2">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[15px] py-[3.125px] relative size-full">
          <p className="[word-break:break-word] flex-[1_0_0] font-['Arvo:Bold',sans-serif] leading-[normal] min-w-px not-italic relative text-[#1e1e1e] text-[20px] text-center">{`Loss & Grief`}</p>
        </div>
      </div>
    </div>
  );
}

function Slot2() {
  return (
    <div className="flex-[1_0_0] h-[112.5px] min-w-px relative" data-name="slot-3">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[22.5px] pr-[15px] py-[3.125px] relative size-full">
          <p className="[word-break:break-word] flex-[1_0_0] font-['Arvo:Bold',sans-serif] leading-[normal] min-w-px not-italic relative text-[#1e1e1e] text-[20px] text-center">Lifetime Price for First 100</p>
        </div>
      </div>
    </div>
  );
}

function SlotForegrounds() {
  return (
    <div className="absolute content-stretch flex gap-[1.25px] inset-0 items-center p-[10px]" data-name="slot-foregrounds">
      <Slot />
      <Slot1 />
      <Slot2 />
    </div>
  );
}

function Lever() {
  return (
    <div className="-translate-y-1/2 absolute h-[79.642px] right-[-49.5px] top-[calc(50%+0.06px)] w-[40px]" data-name="lever">
      <div className="absolute inset-[-152.92%_-124.45%_0_-35.95%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 104.161 201.427">
          <g id="lever">
            <path d={svgPaths.p208766f0} fill="var(--fill-0, white)" id="base" />
            <g id="pull">
              <g id="Vector">
                <path d={svgPaths.p9a25670} fill="var(--fill-0, white)" />
                <path clipRule="evenodd" d={svgPaths.p18116b00} fill="var(--fill-0, white)" fillRule="evenodd" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function Slots() {
  return (
    <div className="relative size-full" data-name="slots">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 562.5 132.5">
        <g id="slot-backgrounds">
          <path d={svgPaths.p2b7aa900} fill="var(--fill-0, white)" id="slot-1" />
          <path clipRule="evenodd" d={svgPaths.paaa9000} fill="var(--fill-0, white)" fillRule="evenodd" id="slot-2" />
          <path clipRule="evenodd" d={svgPaths.p1c22d200} fill="var(--fill-0, white)" fillRule="evenodd" id="slot-3" />
        </g>
      </svg>
      <SlotForegrounds />
      <Lever />
    </div>
  );
}