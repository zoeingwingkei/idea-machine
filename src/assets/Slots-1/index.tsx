import svgPaths from "./svg-2nolbmjll6";

function Slot() {
  return (
    <div className="flex-[1_0_0] h-full min-w-px relative" data-name="slot-1">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[12px] pr-[20px] py-[4px] relative size-full">
          <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Arvo:Bold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#1e1e1e] text-[20px] text-center">
            <p className="leading-[normal]">Subscription Service</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slot1() {
  return (
    <div className="flex-[1_0_0] h-full min-w-px relative" data-name="slot-2">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-[4px] relative size-full">
          <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Arvo:Bold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#1e1e1e] text-[20px] text-center">
            <p className="leading-[normal]">{`Loss & Grief`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slot2() {
  return (
    <div className="flex-[1_0_0] h-full min-w-px relative" data-name="slot-3">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[20px] pr-[12px] py-[4px] relative size-full">
          <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Arvo:Bold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#1e1e1e] text-[20px] text-center">
            <p className="leading-[normal]">Lifetime Price for First 100</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotForegrounds() {
  return (
    <div className="absolute content-stretch flex gap-[4px] inset-0 items-center p-[12px]" data-name="slot-foregrounds">
      <Slot />
      <Slot1 />
      <Slot2 />
    </div>
  );
}

function Lever() {
  return (
    <div className="-translate-y-1/2 absolute h-[64px] right-[-44px] top-1/2 w-[34px]" data-name="lever">
      <div className="absolute inset-[-296.54%_-151.98%_0_-44.76%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100.89 253.785">
          <g id="lever">
            <path d={svgPaths.p31c33cb2} fill="var(--fill-0, white)" id="base" />
            <g id="pull">
              <path d={svgPaths.p244e4a00} fill="var(--fill-0, #EE0000)" id="handle" />
              <path d={svgPaths.p2cb82f00} fill="var(--fill-0, white)" id="Subtract" />
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
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 560 136">
        <g id="slot-backgrounds">
          <path d={svgPaths.p5921000} fill="var(--fill-0, white)" id="slot-1" />
          <path clipRule="evenodd" d={svgPaths.p6ba28f0} fill="var(--fill-0, white)" fillRule="evenodd" id="slot-2" />
          <path clipRule="evenodd" d={svgPaths.p167e8af2} fill="var(--fill-0, white)" fillRule="evenodd" id="slot-3" />
        </g>
      </svg>
      <SlotForegrounds />
      <Lever />
    </div>
  );
}