import { useEffect } from 'react';
import gsap from 'gsap';
import './FlyingPages.css';

const subjects = ['Math', 'Physics', 'Science', 'History', 'English', 'Biology', 'Quiz', 'Manga', 'Script', 'Stats'];
const grades = ['A+', 'A', 'A-', 'B+', 'B', '10/10', '9.5/10', '9/10', '8.5/10', '8/10', '7/10', 'F-'];

export default function FlyingPages() {
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    let accumulatedTime = 0;
    const activeTweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    const spawnedPages: HTMLDivElement[] = [];

    function spawnPage(initialProgress = 0) {
      const page = document.createElement('div');
      page.className = 'flying-page';

      // Pick a random template variant from 0 to 8
      const variant = Math.floor(Math.random() * 9);
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const badgeClass = grade.length > 2 ? 'mini-grade-badge-red wide' : 'mini-grade-badge-red';
      let contentHtml = '';

      if (variant === 0) {
        // Variant 0: Formula Page (Graph Paper, E=mc² and math graph)
        contentHtml = `
          <div class="mini-page-grid">
            <div class="mini-formula-title">${subject.toLowerCase()} formulas</div>
            <div class="mini-formula-body">
              <div class="formula-text">E = mc²</div>
              <svg viewBox="0 0 40 30" class="mini-formula-graph" fill="none" stroke="currentColor">
                <path d="M5 25h30M5 5v20M5 20c5-5 10-12 20-12" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        `;
      } else if (variant === 1) {
        // Variant 1: Manga Panel Draft Page (Comic panels with 3 stick figures, speech bubble)
        contentHtml = `
          <div class="mini-page-manga">
            <div class="manga-panel panel-top">
              <svg viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="1.2" style="width: 30px; height: 22px; color: #475569;">
                <!-- Stick Figure 1 (Left) -->
                <circle cx="10" cy="8" r="3.5"/>
                <path d="M10 11.5v8M6 14h8M10 19.5l-3.5 5.5M10 19.5l3.5 5.5" stroke-linecap="round"/>
                
                <!-- Stick Figure 2 (Middle, waving arm) -->
                <circle cx="20" cy="8" r="3.5"/>
                <path d="M20 11.5v8M15 14h5l3.5-3.5M20 19.5l-3.5 5.5M20 19.5l3.5 5.5" stroke-linecap="round"/>
                
                <!-- Stick Figure 3 (Right) -->
                <circle cx="30" cy="10" r="2.8"/>
                <path d="M30 12.8v6.5M26.5 15h7M30 19.3l-2.5 5.2M30 19.3l2.5 5.2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="manga-panel-row">
              <div class="manga-panel panel-left">
                <div class="speech-bubble">?!</div>
              </div>
              <div class="manga-panel panel-right"></div>
            </div>
          </div>
        `;
      } else if (variant === 2) {
        // Variant 2: Graded Lined Notebook Page (With Grade, blue lines, and teacher checks)
        contentHtml = `
          <div class="mini-page-lined">
            <div class="mini-margin-red"></div>
            <div class="${badgeClass}">${grade}</div>
            <div class="mini-title-handwritten">${subject.toLowerCase()} quiz</div>
            <div class="mini-lined-content-lines">
              <div class="mini-notebook-line-checked">
                <span class="mini-check">✓</span>
                <div class="mini-notebook-line"></div>
              </div>
              <div class="mini-notebook-line-checked">
                <span class="mini-check">✓</span>
                <div class="mini-notebook-line"></div>
              </div>
              <div class="mini-notebook-line-checked">
                <span class="mini-check red">✗</span>
                <div class="mini-notebook-line short"></div>
              </div>
              <div class="mini-notebook-line-checked">
                <span class="mini-check">✓</span>
                <div class="mini-notebook-line"></div>
              </div>
            </div>
          </div>
        `;
      } else if (variant === 3) {
        // Variant 3: Concept Map / Idea Page (No Grade, grid lines, concept connection)
        contentHtml = `
          <div class="mini-page-grid">
            <div class="mini-title-handwritten">ideas:</div>
            <div class="mini-grid-content">
              <div style="display: flex; align-items: center; justify-content: center; margin: 2px 0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; color: #fb923c;">
                  <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-6 6c0 2.2 1.2 4.1 3 5.2v2.8h6v-2.8c1.8-1.1 3-3 3-5.2a6 6 0 0 0-6-6z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div style="font-size: 5px; text-align: center; font-weight: bold; color: #475569;">
                Concept <span class="mini-arrow">→</span> Story
              </div>
            </div>
          </div>
        `;
      } else if (variant === 4) {
        // Variant 4: Graded Storyboard Draft (With Grade, typewriter text, and landscape sketch)
        contentHtml = `
          <div class="mini-page-script-graded">
            <div class="${badgeClass}">${grade}</div>
            <div class="mini-script-header">STORYBOARD</div>
            <div class="mini-storyboard-box">
              <svg viewBox="0 0 40 20" fill="none" stroke="currentColor" stroke-width="1" class="doodle-svg-storyboard">
                <path d="M3 17l8-9 6 6 10-11 10 12M5 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="mini-script-action">PANEL 3 - CUT TO:</div>
          </div>
        `;
      } else if (variant === 5) {
        // Variant 5: Bar Chart Page (Grid Paper, Math stats, hand-drawn columns)
        contentHtml = `
          <div class="mini-page-grid">
            <div class="mini-formula-title">${subject.toLowerCase()} stats</div>
            <div class="mini-formula-body">
              <svg viewBox="0 0 40 30" class="mini-bar-chart" fill="none" stroke="currentColor" stroke-width="1.2">
                <path d="M5 5v20h30" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="9" y="15" width="5" height="10" fill="rgba(56, 189, 248, 0.2)" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="18" y="9" width="5" height="16" fill="rgba(251, 146, 60, 0.2)" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="27" y="17" width="5" height="8" fill="rgba(34, 211, 250, 0.2)" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        `;
      } else if (variant === 6) {
        // Variant 6: Pie Chart Page (Grid Paper, Data pie chart with slices)
        contentHtml = `
          <div class="mini-page-grid">
            <div class="mini-formula-title">${subject.toLowerCase()} data</div>
            <div class="mini-formula-body">
              <svg viewBox="0 0 30 30" class="mini-pie-chart" fill="none" stroke="currentColor" stroke-width="1.2">
                <circle cx="15" cy="15" r="10" stroke-linecap="round"/>
                <path d="M15 15l7-7M15 15v-10M15 15l-9 5" stroke-linecap="round"/>
                <path d="M15 15l7-7A10 10 0 0 0 15 5v10" fill="rgba(251, 146, 60, 0.25)"/>
                <path d="M15 15v-10A10 10 0 0 0 6 20l9-5" fill="rgba(56, 189, 248, 0.25)"/>
              </svg>
            </div>
          </div>
        `;
      } else if (variant === 7) {
        // Variant 7: Pure Lined Note Page (Notebook lines/stripes with a simple title 'notes', no grade)
        contentHtml = `
          <div class="mini-page-lined">
            <div class="mini-margin-red"></div>
            <div class="mini-title-handwritten">notes</div>
            <div class="mini-lined-content-lines">
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
            </div>
          </div>
        `;
      } else {
        // Variant 8: Project Logo v2 Page
        contentHtml = `
          <div class="mini-page-logo-container">
            <img src="/project-logo-v2.png" class="mini-page-logo-img" alt="Logo" />
          </div>
        `;
      }

      page.innerHTML = contentHtml;

      if (Math.random() > 0.5) {
        page.classList.add('flipped');
      }

      // Append to final-section — it clips flying pages within its own bounds
      const finalSection = document.querySelector('.final-section');
      if (finalSection) {
        finalSection.appendChild(page);
      } else {
        document.body.appendChild(page);
      }
      spawnedPages.push(page);

      const wrapper = document.querySelector('.css-book-wrapper');
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();

      const initialOffset = (Math.random() - 0.5) * 120;
      let spawnX = rect.left + rect.width / 2 + initialOffset;
      let spawnY = rect.top + 155;

      if (finalSection) {
        const sectionRect = finalSection.getBoundingClientRect();
        spawnX = spawnX - sectionRect.left;
        spawnY = spawnY - sectionRect.top;
      } else {
        spawnX += window.scrollX;
        spawnY += window.scrollY;
      }

      // Scatter: strong X drift, still trends upward
      const driftX = (Math.random() - 0.5) * (isMobile ? 320 : 700);
      const driftZ = (Math.random() - 0.5) * 80;

      gsap.set(page, {
        left: 0,
        top: 0,
        margin: 0,
        x: spawnX,
        y: spawnY,
        z: driftZ,
        transformPerspective: 9000,
        xPercent: -50,
        yPercent: -50,
        rotationY: (Math.random() - 0.5) * 30,
        rotationZ: (Math.random() - 0.5) * 20,
        scale: 0.25,
        opacity: 0
      });

      let targetY = -200;
      if (finalSection) {
        const sectionRect = finalSection.getBoundingClientRect();
        targetY = -(sectionRect.top + window.scrollY) - 200;
      }

      // Calm rotations — no more ±1440° chaos
      const rotXEnd = (Math.random() - 0.5) * 90;
      const rotYEnd = (Math.random() - 0.5) * 120;
      const rotZEnd = (Math.random() - 0.5) * 60;
      const scaleEnd = isMobile ? (0.9 + Math.random() * 0.25) : (1.1 + Math.random() * 0.4);

      const distance = spawnY - targetY;
      const speed = 90 + Math.random() * 130;
      const flyDuration = distance / speed;

      // Calculate when the page reaches y=0 (top of final-section = clip boundary)
      // y(t) = spawnY + (targetY - spawnY) * t/flyDuration
      // y=0 when t = spawnY / (spawnY - targetY) * flyDuration
      const clipCrossTime = spawnY > 0
        ? (spawnY / (spawnY - targetY)) * flyDuration
        : flyDuration * 0.5; // fallback

      // Fade starts at 45% of clip-cross time, ends at 97% — long gradual fade
      const fadeOutStart = clipCrossTime * 0.45;
      const fadeOutDuration = clipCrossTime * 0.50; // ends at ~95% of clip-cross

      const flyTimeline = gsap.timeline();

      // Main upward travel
      flyTimeline.to(page, {
        y: targetY,
        rotationX: rotXEnd,
        rotationY: rotYEnd,
        rotationZ: rotZEnd,
        duration: flyDuration,
        ease: 'none',
        onComplete: () => {
          if (page.parentNode) page.parentNode.removeChild(page);
          const index = spawnedPages.indexOf(page);
          if (index > -1) spawnedPages.splice(index, 1);
        }
      }, 0);

      // Fade IN: opacity 0 → 1 in first 1s
      flyTimeline.to(page, {
        opacity: 1,
        duration: 1.0,
        ease: 'power1.out'
      }, 0);

      // Scale burst: small → full
      flyTimeline.to(page, {
        scale: scaleEnd,
        duration: 1.2,
        ease: 'back.out(1.4)'
      }, 0);

      // Hold scale until fade starts
      const holdDuration = Math.max(0.01, fadeOutStart - 1.2);
      flyTimeline.to(page, {
        scale: scaleEnd * 0.85,
        duration: holdDuration,
        ease: 'none'
      }, 1.2);

      // Fade OUT + shrink: starts WELL before clip boundary, ends just before y=0
      flyTimeline.to(page, {
        opacity: 0,
        scale: 0.15,
        duration: fadeOutDuration,
        ease: 'power2.in'
      }, fadeOutStart);

      // X scatter
      const xTween = gsap.to(page, {
        x: spawnX + driftX,
        duration: flyDuration * 0.9,
        ease: 'power2.out'
      });

      activeTweens.push(flyTimeline, xTween);

      if (initialProgress > 0) {
        flyTimeline.progress(initialProgress);
        xTween.progress(Math.min(initialProgress / 0.9, 1));
      }

      page.addEventListener('mouseenter', () => {
        flyTimeline.pause();
        xTween.pause();
        gsap.to(page, { scale: scaleEnd * 1.5, zIndex: 2000, duration: 0.3 });
      });
      page.addEventListener('mouseleave', () => {
        flyTimeline.play();
        xTween.play();
        gsap.to(page, { scale: scaleEnd, zIndex: 1000, duration: 0.3 });
      });
    }

    const initialCount = isMobile ? 8 : 20;
    for (let i = 0; i < initialCount; i++) {
      spawnPage(Math.random());
    }

    const tickHandler = (_time: number, deltaTime: number) => {
      accumulatedTime += deltaTime;
      if (accumulatedTime >= (isMobile ? 600 : 350)) {
        spawnPage();
        accumulatedTime = 0;
      }
    };

    gsap.ticker.add(tickHandler);

    return () => {
      gsap.ticker.remove(tickHandler);
      activeTweens.forEach(t => t.kill());
      spawnedPages.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, []);

  return null;
}
