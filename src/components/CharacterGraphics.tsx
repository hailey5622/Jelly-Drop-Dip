import React from 'react';
import { motion } from 'motion/react';

interface CharacterProps {
  className?: string;
  size?: number;
}

// Start screen graphic: Character on a swing above the purple grape jelly pool
export const StartScreenHero: React.FC<CharacterProps> = ({ size = 200 }) => {
  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: size, height: size * 1.05 }}>
      {/* Floating clouds with words */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute top-1 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs border border-violet-100 flex items-center gap-1 z-10 text-[11px] font-bold text-violet-700"
      >
        <span>☁️</span>
        <span>bullet</span>
      </motion.div>

      <motion.div
        animate={{ y: [4, -4, 4] }}
        transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-6 right-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs border border-violet-100 flex items-center gap-1 z-10 text-[11px] font-bold text-amber-600"
      >
        <span>☁️</span>
        <span>leg</span>
      </motion.div>

      {/* Hanging rope & swing */}
      <svg width={size} height={size * 0.9} viewBox="0 0 200 180" className="overflow-visible">
        {/* Ropes from top */}
        <line x1="82" y1="0" x2="86" y2="70" stroke="#78350F" strokeWidth="2.5" strokeDasharray="3,2" />
        <line x1="118" y1="0" x2="114" y2="70" stroke="#78350F" strokeWidth="2.5" strokeDasharray="3,2" />
        
        {/* Wooden swing plank */}
        <rect x="74" y="68" width="52" height="6" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />

        {/* Character sitting on swing */}
        <g id="hero-character">
          {/* Body */}
          <ellipse cx="100" cy="54" rx="22" ry="20" fill="#FBBF24" stroke="#D97706" strokeWidth="2.5" />
          
          {/* Ears */}
          <circle cx="84" cy="38" r="6" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          <circle cx="116" cy="38" r="6" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          <circle cx="84" cy="38" r="3" fill="#FDE68A" />
          <circle cx="116" cy="38" r="3" fill="#FDE68A" />

          {/* Cheeks */}
          <circle cx="88" cy="56" r="3.5" fill="#F87171" opacity="0.65" />
          <circle cx="112" cy="56" r="3.5" fill="#F87171" opacity="0.65" />

          {/* Happy Eyes */}
          <path d="M 90 48 Q 94 44 98 48" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 102 48 Q 106 44 110 48" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Open Happy Smile */}
          <path d="M 96 56 Q 100 62 104 56" fill="#78350F" />

          {/* Hands holding ropes */}
          <circle cx="85" cy="62" r="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="115" cy="62" r="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />

          {/* Cute dangling legs */}
          <rect x="91" y="72" width="6" height="12" rx="3" fill="#F59E0B" />
          <rect x="103" y="72" width="6" height="12" rx="3" fill="#F59E0B" />
        </g>

        {/* Purple Jelly Pool at Bottom */}
        <g id="jelly-pool">
          <defs>
            <linearGradient id="purpleJellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#7E22CE" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#581C87" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="jellyGloss" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#C084FC" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Shimmering Jelly Bowl */}
          <rect x="25" y="118" width="150" height="52" rx="20" fill="url(#purpleJellyGrad)" />
          
          {/* Jelly Surface wave */}
          <path
            d="M 28 126 Q 60 120 100 126 Q 140 132 172 126 L 172 145 Q 140 152 100 145 Q 60 138 28 145 Z"
            fill="#9333EA"
            opacity="0.6"
          />

          {/* Gloss highlight */}
          <ellipse cx="65" cy="126" rx="22" ry="4" fill="url(#jellyGloss)" />
          <ellipse cx="140" cy="128" rx="14" ry="3" fill="url(#jellyGloss)" />

          {/* Bubbles in Jelly */}
          <circle cx="50" cy="146" r="3.5" fill="#E9D5FF" opacity="0.6" />
          <circle cx="110" cy="150" r="4.5" fill="#E9D5FF" opacity="0.5" />
          <circle cx="150" cy="142" r="3" fill="#E9D5FF" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
};

// Word Catch Mode: Character holding a big basket
export const BasketCharacter: React.FC<{
  positionXPercent: number; // 0 to 100
  isCatching?: boolean;
  isStumbling?: boolean;
}> = ({ positionXPercent, isCatching = false, isStumbling = false }) => {
  return (
    <div
      className="absolute bottom-2 pointer-events-none transition-all duration-75 ease-out select-none"
      style={{
        left: `${positionXPercent}%`,
        transform: 'translateX(-50%)',
        width: '100px',
        height: '92px'
      }}
    >
      <motion.div
        animate={
          isStumbling
            ? { rotate: [-12, 12, -8, 8, 0], y: [0, 4, -2, 0] }
            : isCatching
            ? { scale: [1, 1.15, 0.95, 1], y: [-8, 2, 0] }
            : { y: [0, -2, 0] }
        }
        transition={{ duration: isCatching ? 0.25 : isStumbling ? 0.35 : 1, repeat: isCatching || isStumbling ? 0 : Infinity }}
        className="w-full h-full relative flex flex-col items-center"
      >
        <svg width="100" height="92" viewBox="0 0 100 92" className="overflow-visible">
          {/* Basket on top of head */}
          <g id="basket" transform="translate(0, 0)">
            {/* Basket base */}
            <path
              d="M 12 18 L 22 44 Q 50 48 78 44 L 88 18 Q 50 14 12 18 Z"
              fill="#D97706"
              stroke="#78350F"
              strokeWidth="2.5"
            />
            {/* Basket rim */}
            <ellipse cx="50" cy="18" rx="38" ry="6" fill="#F59E0B" stroke="#78350F" strokeWidth="2.5" />
            {/* Woven weave lines */}
            <path d="M 28 22 L 34 42" stroke="#B45309" strokeWidth="2" strokeDasharray="3,2" />
            <path d="M 42 23 L 44 45" stroke="#B45309" strokeWidth="2" strokeDasharray="3,2" />
            <path d="M 58 23 L 56 45" stroke="#B45309" strokeWidth="2" strokeDasharray="3,2" />
            <path d="M 72 22 L 66 42" stroke="#B45309" strokeWidth="2" strokeDasharray="3,2" />

            {/* Glowing sparkle if catching */}
            {isCatching && (
              <circle cx="50" cy="18" r="8" fill="#FDE047" opacity="0.8" className="animate-ping" />
            )}
          </g>

          {/* Character Body below basket */}
          <g id="catcher-body">
            {/* Body */}
            <ellipse cx="50" cy="62" rx="20" ry="18" fill="#FBBF24" stroke="#D97706" strokeWidth="2.5" />

            {/* Cheeks */}
            <circle cx="38" cy="64" r="3" fill="#F87171" opacity="0.65" />
            <circle cx="62" cy="64" r="3" fill="#F87171" opacity="0.65" />

            {/* Eyes */}
            {isStumbling ? (
              <>
                {/* Dizzy X eyes */}
                <path d="M 39 56 L 45 62 M 45 56 L 39 62" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
                <path d="M 55 56 L 61 62 M 61 56 L 55 62" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
                {/* Wobbly mouth */}
                <path d="M 44 68 Q 50 64 56 68" stroke="#78350F" strokeWidth="2" fill="none" strokeLinecap="round" />
              </>
            ) : isCatching ? (
              <>
                {/* Super happy crescent eyes */}
                <path d="M 38 58 Q 42 53 46 58" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 54 58 Q 58 53 62 58" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Open mouth */}
                <ellipse cx="50" cy="68" rx="4" ry="4" fill="#78350F" />
              </>
            ) : (
              <>
                {/* Focused forward eyes */}
                <circle cx="42" cy="58" r="2.8" fill="#78350F" />
                <circle cx="58" cy="58" r="2.8" fill="#78350F" />
                <circle cx="43" cy="57" r="1" fill="#FFFFFF" />
                <circle cx="59" cy="57" r="1" fill="#FFFFFF" />
                {/* Friendly smile */}
                <path d="M 46 66 Q 50 69 54 66" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
              </>
            )}

            {/* Paws lifting the basket */}
            <ellipse cx="26" cy="46" rx="5" ry="4" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
            <ellipse cx="74" cy="46" rx="5" ry="4" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />

            {/* Little running feet */}
            <ellipse cx="42" cy="79" rx="6" ry="3.5" fill="#D97706" />
            <ellipse cx="58" cy="79" rx="6" ry="3.5" fill="#D97706" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

// Jelly Dip Hangman Character Component
export const HangingJellyCharacter: React.FC<{
  mistakes: number; // 0 = safe, 1 = warning (frayed rope & scared), 2 = dipped in jelly!
  isSuccess?: boolean;
}> = ({ mistakes, isSuccess = false }) => {
  return (
    <div className="relative w-full h-[220px] flex flex-col items-center justify-start overflow-hidden select-none">
      <svg width="280" height="220" viewBox="0 0 280 220" className="overflow-visible">
        <defs>
          <linearGradient id="purpleJellyFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#9333EA" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#581C87" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* Beam bar at top */}
        <rect x="40" y="2" width="200" height="10" rx="4" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
        <circle cx="140" cy="7" r="3" fill="#D97706" />

        {/* --- SCENARIO 1: SAFE (0 MISTAKES) --- */}
        {mistakes === 0 && !isSuccess && (
          <g id="state-safe">
            {/* Taut strong rope */}
            <line x1="140" y1="12" x2="140" y2="78" stroke="#92400E" strokeWidth="4.5" strokeDasharray="4,2" />
            <circle cx="140" cy="78" r="4" fill="#78350F" />

            {/* Character hanging happily */}
            <g transform="translate(140, 96)">
              {/* Hands on rope */}
              <circle cx="-6" cy="-16" r="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              <circle cx="6" cy="-16" r="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />

              {/* Body */}
              <ellipse cx="0" cy="0" rx="20" ry="18" fill="#FBBF24" stroke="#D97706" strokeWidth="2.5" />
              
              {/* Ears */}
              <circle cx="-14" cy="-14" r="5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              <circle cx="14" cy="-14" r="5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />

              {/* Eyes - Happy & relaxed */}
              <circle cx="-7" cy="-2" r="2.5" fill="#78350F" />
              <circle cx="7" cy="-2" r="2.5" fill="#78350F" />
              <circle cx="-6" cy="-3" r="0.8" fill="#FFFFFF" />
              <circle cx="8" cy="-3" r="0.8" fill="#FFFFFF" />

              {/* Cheeks */}
              <circle cx="-12" cy="4" r="3" fill="#F87171" opacity="0.65" />
              <circle cx="12" cy="4" r="3" fill="#F87171" opacity="0.65" />

              {/* Mouth */}
              <path d="M -4 6 Q 0 9 4 6" stroke="#78350F" strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Dangling feet */}
              <ellipse cx="-8" cy="18" rx="4.5" ry="3" fill="#D97706" />
              <ellipse cx="8" cy="18" rx="4.5" ry="3" fill="#D97706" />
            </g>
          </g>
        )}

        {/* --- SCENARIO 2: WARNING (1 MISTAKE) --- */}
        {mistakes === 1 && (
          <g id="state-warning">
            {/* Stretched and fraying rope, dropping character lower */}
            <line x1="140" y1="12" x2="140" y2="108" stroke="#B45309" strokeWidth="3" strokeDasharray="3,2" />
            {/* Fraying strands */}
            <path d="M 137 54 L 132 50 M 143 56 L 148 52 M 138 68 L 133 66" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

            {/* Character shaking/sweating closer to jelly */}
            <g transform="translate(140, 126)">
              {/* Sweat drop */}
              <path d="M 18 -18 C 18 -18, 22 -12, 22 -8 C 22 -5, 20 -3, 17 -3 C 14 -3, 13 -5, 13 -8 C 13 -12, 18 -18, 18 -18 Z" fill="#60A5FA" />

              {/* Hands clutching tightly */}
              <circle cx="-5" cy="-16" r="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              <circle cx="5" cy="-16" r="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />

              {/* Body */}
              <ellipse cx="0" cy="0" rx="20" ry="18" fill="#FBBF24" stroke="#D97706" strokeWidth="2.5" />

              {/* Ears */}
              <circle cx="-14" cy="-14" r="5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              <circle cx="14" cy="-14" r="5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />

              {/* Scared wide eyes */}
              <circle cx="-7" cy="-2" r="4" fill="#FFFFFF" stroke="#78350F" strokeWidth="1.5" />
              <circle cx="7" cy="-2" r="4" fill="#FFFFFF" stroke="#78350F" strokeWidth="1.5" />
              <circle cx="-7" cy="-1" r="2" fill="#78350F" />
              <circle cx="7" cy="-1" r="2" fill="#78350F" />

              {/* Wobbly scared mouth */}
              <path d="M -6 7 Q -2 4 0 7 Q 3 10 6 7" stroke="#78350F" strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Kicking feet near jelly */}
              <ellipse cx="-8" cy="18" rx="4.5" ry="3" fill="#D97706" transform="rotate(15, -8, 18)" />
              <ellipse cx="8" cy="18" rx="4.5" ry="3" fill="#D97706" transform="rotate(-15, 8, 18)" />
            </g>
          </g>
        )}

        {/* --- SCENARIO 3: DIPPED IN JELLY! (2 MISTAKES = STRIKE OUT) --- */}
        {mistakes >= 2 && (
          <g id="state-dipped">
            {/* Snapped rope trailing from top */}
            <path d="M 140 12 Q 138 35 133 48" stroke="#78350F" strokeWidth="3.5" strokeDasharray="3,2" fill="none" />
            <path d="M 133 48 L 130 52 M 134 49 L 137 54" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

            {/* SPLASH TEXT "풍덩!" */}
            <g transform="translate(140, 125)">
              <rect x="-42" y="-20" width="84" height="24" rx="12" fill="#7E22CE" stroke="#FDE047" strokeWidth="2" />
              <text x="0" y="-4" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                풍덩! (DIP)
              </text>
            </g>

            {/* Purple jelly splash droplets flying in air */}
            <circle cx="95" cy="148" r="5" fill="#C084FC" className="animate-bounce" />
            <circle cx="115" cy="138" r="6" fill="#A855F7" />
            <circle cx="165" cy="136" r="6.5" fill="#9333EA" />
            <circle cx="185" cy="148" r="4.5" fill="#C084FC" />
            <circle cx="140" cy="130" r="4" fill="#E9D5FF" />

            {/* Submerged Character half stuck in purple jelly! */}
            <g transform="translate(140, 168)">
              {/* Top half of head poking out */}
              <path
                d="M -18 0 Q -20 -16 0 -16 Q 20 -16 18 0 Z"
                fill="#FBBF24"
                stroke="#D97706"
                strokeWidth="2"
              />

              {/* Ears covered in purple goo */}
              <circle cx="-14" cy="-14" r="5" fill="#A855F7" />
              <circle cx="14" cy="-14" r="5" fill="#A855F7" />

              {/* Dizzy spiral eyes */}
              <path d="M -8 -8 Q -5 -11 -2 -8 Q 1 -5 -2 -2" stroke="#78350F" strokeWidth="1.8" fill="none" />
              <path d="M 4 -8 Q 7 -11 10 -8 Q 13 -5 10 -2" stroke="#78350F" strokeWidth="1.8" fill="none" />

              {/* Surprised "O" mouth */}
              <circle cx="0" cy="-2" r="3" fill="#78350F" />

              {/* Purple jelly dripping on head */}
              <path d="M -10 -15 Q -6 -7 -2 -14 Q 3 -8 8 -15" fill="#9333EA" stroke="#7E22CE" strokeWidth="1" />
            </g>
          </g>
        )}

        {/* --- SCENARIO 4: SUCCESS / RESCUED! --- */}
        {isSuccess && (
          <g id="state-rescued">
            {/* Pulled up high rope */}
            <line x1="140" y1="12" x2="140" y2="48" stroke="#92400E" strokeWidth="4.5" />

            {/* Character rescued and cheering */}
            <g transform="translate(140, 60)">
              {/* Twinkling stars */}
              <text x="-35" y="-12" fontSize="16">✨</text>
              <text x="24" y="-12" fontSize="16">🎉</text>

              {/* Body */}
              <ellipse cx="0" cy="0" rx="20" ry="18" fill="#FBBF24" stroke="#D97706" strokeWidth="2.5" />
              
              {/* Cheerful V-arms raised */}
              <line x1="-16" y1="-4" x2="-26" y2="-18" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
              <line x1="16" y1="-4" x2="26" y2="-18" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

              {/* Super happy eyes */}
              <path d="M -9 -2 Q -5 -7 -1 -2" stroke="#78350F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 1 -2 Q 5 -7 9 -2" stroke="#78350F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              
              {/* Big smile */}
              <path d="M -5 4 Q 0 10 5 4 Z" fill="#78350F" />
              <circle cx="-12" cy="3" r="3" fill="#F87171" opacity="0.7" />
              <circle cx="12" cy="3" r="3" fill="#F87171" opacity="0.7" />
            </g>
          </g>
        )}

        {/* Grape Jelly Pool at bottom */}
        <g id="bottom-purple-jelly" transform="translate(0, 160)">
          {/* Main pool */}
          <rect x="20" y="8" width="240" height="52" rx="20" fill="url(#purpleJellyFill)" />
          
          {/* Surface ripple */}
          <path
            d="M 22 18 Q 70 8 140 18 Q 210 26 258 18 L 258 35 Q 210 42 140 34 Q 70 26 22 35 Z"
            fill="#A855F7"
            opacity="0.5"
          />

          {/* Bubbles in jelly */}
          <circle cx="55" cy="35" r="4" fill="#F3E8FF" opacity="0.6" />
          <circle cx="100" cy="40" r="5.5" fill="#F3E8FF" opacity="0.5" />
          <circle cx="180" cy="38" r="4" fill="#F3E8FF" opacity="0.6" />
          <circle cx="225" cy="32" r="5" fill="#F3E8FF" opacity="0.4" />

          {/* Jelly Label */}
          <text x="140" y="44" textAnchor="middle" fill="#E9D5FF" fontSize="11" fontWeight="bold" letterSpacing="1" opacity="0.8">
            GRAPE JELLY POOL
          </text>
        </g>
      </svg>
    </div>
  );
};
