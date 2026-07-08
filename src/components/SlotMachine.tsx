import { useCallback, useMemo, useRef, useState } from 'react';
import Reel, { type ReelHandle } from './Reel';
import { article, formatPool, rollIdea, spacePool, twistPool, type Idea } from '../data/pools';
import titleArt from '../assets/idea-machine/title.svg';
import flourish from '../assets/idea-machine/flourish.svg';
import './SlotMachine.css';

const LIGHT_COUNT = 12;
const MAX_LEVER_ANGLE = 30;
const DRAG_SENSITIVITY = 0.35;
const SPIN_DELAYS = [1300, 2000, 2700] as const;

// Traced from the Figma slot-background vectors (nodes 8:10559/60/61), each
// normalized to a 0-1 objectBoundingBox so they scale with the reel window at
// any size. The three slots are NOT the same shape: the outer edge of slot 1
// and slot 3 is a single smooth bulge, while the edges facing a neighboring
// reel (slot 1's right, slot 2's both sides, slot 3's left) pinch inward at
// the vertical center with a bulge above and below — like two reels almost
// touching.
const REEL_SLOT_PATHS = [
  // slot-1 (leftmost): smooth outer-left edge, pinched inner-right edge
  'M 0.96128 0.49779 C 0.96128 0.64148 0.97301 0.77938 0.99454 0.90740 C 1.00190 0.95118 0.98156 0.99558 0.95281 0.99558 H 0.05543 C 0.03401 0.99558 0.01596 0.97026 0.01382 0.93667 C 0.00471 0.79313 0.00000 0.64662 0.00000 0.49779 C 0.00000 0.34895 0.00471 0.20245 0.01382 0.05890 C 0.01596 0.02532 0.03401 0.00000 0.05543 0.00000 H 0.95281 C 0.98156 0.00000 1.00190 0.04440 0.99454 0.08817 C 0.97301 0.21620 0.96128 0.35409 0.96128 0.49779 Z',
  // slot-2 (middle): pinched on both sides, facing slot 1 and slot 3
  'M 0.10587 0.99558 C 0.06885 0.99558 0.03594 0.95679 0.02773 0.89929 C 0.00976 0.77356 0.00000 0.63845 0.00000 0.49779 C 0.00000 0.35712 0.00976 0.22202 0.02773 0.09628 C 0.03594 0.03879 0.06885 0.00000 0.10587 0.00000 H 0.89413 C 0.93115 0.00000 0.96406 0.03879 0.97227 0.09628 C 0.99024 0.22202 1.00000 0.35712 1.00000 0.49779 C 1.00000 0.63845 0.99024 0.77356 0.97227 0.89929 C 0.96406 0.95679 0.93115 0.99558 0.89413 0.99558 H 0.10587 Z',
  // slot-3 (rightmost): pinched inner-left edge, smooth outer-right edge
  'M 0.03477 0.49779 C 0.03477 0.35409 0.02305 0.21620 0.00152 0.08817 C -0.00585 0.04440 0.01449 0.00000 0.04324 0.00000 H 0.94062 C 0.96205 0.00000 0.98010 0.02532 0.98223 0.05890 C 0.99135 0.20245 0.99606 0.34895 0.99606 0.49779 C 0.99606 0.64662 0.99135 0.79313 0.98223 0.93667 C 0.98010 0.97026 0.96205 0.99558 0.94062 0.99558 H 0.04324 C 0.01449 0.99558 -0.00585 0.95118 0.00152 0.90740 C 0.02305 0.77938 0.03477 0.64148 0.03477 0.49779 Z',
] as const;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function SlotMachine() {
  const [idea, setIdea] = useState<Idea>(() => rollIdea());
  const [spinning, setSpinning] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [ticketVisible, setTicketVisible] = useState(false);
  const [leverAngle, setLeverAngle] = useState(0);
  const [dragging, setDragging] = useState(false);

  const formatReel = useRef<ReelHandle>(null);
  const spaceReel = useRef<ReelHandle>(null);
  const twistReel = useRef<ReelHandle>(null);
  const dragState = useRef({ startY: 0, startedAt: 0, moved: 0 });
  const spinningRef = useRef(false);

  const startSpin = useCallback(async () => {
    if (spinningRef.current) return;
    spinningRef.current = true;
    setSpinning(true);
    setTicketVisible(false);

    const nextIdea = rollIdea();

    await Promise.all([
      formatReel.current?.spin(nextIdea.format, SPIN_DELAYS[0]),
      spaceReel.current?.spin(nextIdea.space, SPIN_DELAYS[1]),
      twistReel.current?.spin(nextIdea.twist, SPIN_DELAYS[2]),
    ]);

    setIdea(nextIdea);
    setCelebrating(true);
    await wait(650);

    setTicketVisible(true);
    await wait(700);

    setCelebrating(false);
    spinningRef.current = false;
    setSpinning(false);
  }, []);

  const pullLever = useCallback(() => {
    if (spinningRef.current) return;
    setDragging(false);
    setLeverAngle(MAX_LEVER_ANGLE);
    window.setTimeout(() => setLeverAngle(0), 90);
    void startSpin();
  }, [startSpin]);

  const releaseLever = useCallback(() => {
    setDragging(false);
    setLeverAngle(0);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (spinningRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startY: e.clientY, startedAt: performance.now(), moved: 0 };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging || spinningRef.current) return;
      const deltaY = e.clientY - dragState.current.startY;
      dragState.current.moved = Math.max(dragState.current.moved, Math.abs(deltaY));
      const angle = Math.min(MAX_LEVER_ANGLE, Math.max(0, deltaY * DRAG_SENSITIVITY));
      setLeverAngle(angle);
    },
    [dragging],
  );

  const onPointerUp = useCallback(() => {
    if (spinningRef.current) {
      releaseLever();
      return;
    }
    const elapsed = performance.now() - dragState.current.startedAt;
    const wasTap = elapsed < 200 && dragState.current.moved < 6;
    const draggedFarEnough = leverAngle >= MAX_LEVER_ANGLE * 0.55;

    if (wasTap || draggedFarEnough) {
      pullLever();
    } else {
      releaseLever();
    }
  }, [leverAngle, pullLever, releaseLever]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pullLever();
      }
    },
    [pullLever],
  );

  const lights = useMemo(() => Array.from({ length: LIGHT_COUNT }), []);

  return (
    <div className="idea-machine">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          {REEL_SLOT_PATHS.map((d, i) => (
            <clipPath id={`reel-slot-shape-${i}`} clipPathUnits="objectBoundingBox" key={i}>
              <path d={d} />
            </clipPath>
          ))}
        </defs>
      </svg>

      <img className="machine-title" src={titleArt} alt="What to Build? — The Idea Machine" draggable={false} />

      <div className="machine-body">
        <div className={`lights-row ${celebrating ? 'is-winning' : ''}`}>
          {lights.map((_, i) => (
            <span className="light" key={i} style={{ animationDelay: `${i * 40}ms` }} />
          ))}
        </div>

        <div className="slot-labels">
          <p>Format</p>
          <p>Space</p>
          <p>Twist</p>
        </div>

        <div className="slots-row">
          <div className="reel-slot">
            <Reel ref={formatReel} pool={formatPool} initial={idea.format} clipPathId="reel-slot-shape-0" />
          </div>
          <div className="reel-slot">
            <Reel ref={spaceReel} pool={spacePool} initial={idea.space} clipPathId="reel-slot-shape-1" />
          </div>
          <div className="reel-slot">
            <Reel ref={twistReel} pool={twistPool} initial={idea.twist} clipPathId="reel-slot-shape-2" />
          </div>

          <button
            type="button"
            className="lever"
            style={{
              transform: `translateY(-50%) rotate(${-leverAngle}deg)`,
              transition: dragging ? 'none' : undefined,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={releaseLever}
            onKeyDown={onKeyDown}
            disabled={spinning}
            aria-label="Pull the lever to generate an idea"
          >
            <svg viewBox="0 0 52 225" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="154.375" width="46.25" height="67.5" rx="12.5" fill="#fff" stroke="#0a0a0a" strokeWidth="5" />
              <rect x="21.25" y="30" width="20" height="132.5" rx="10" fill="#fff" stroke="#0a0a0a" strokeWidth="5" />
              <circle cx="31.25" cy="20.625" r="18.125" fill="#fff" stroke="#0a0a0a" strokeWidth="5" />
            </svg>
          </button>
        </div>

        <div className={`lights-row ${celebrating ? 'is-winning' : ''}`}>
          {lights.map((_, i) => (
            <span className="light" key={i} style={{ animationDelay: `${i * 40}ms` }} />
          ))}
        </div>

        <div className="output-row">
          <div className="output-slot" />
        </div>
      </div>

      <div className="ticket-space">
        <div className={`ticket ${ticketVisible ? 'is-out' : ''}`}>
          <div className="ticket-title">
            <img src={flourish} alt="" draggable={false} />
            <span>Your Idea</span>
            <img src={flourish} alt="" className="mirror" draggable={false} />
          </div>
          <p className="ticket-sentence">
            <em>{article(idea.format)}</em> <strong>{idea.format}</strong> <em>for</em> <strong>{idea.space}</strong>
            {' — '}
            <strong>{idea.twist}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
