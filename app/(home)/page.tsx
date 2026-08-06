import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  Download,
  ShieldCheck,
  TerminalSquare,
  Wrench,
  CircuitBoard,
} from 'lucide-react';
import { getCourses, type Course } from '@/lib/courses';
import { getResources } from '@/lib/resources';
import { BrandLogo } from '@/components/brand-logo';
import { FadeInSection, StatShuffleCounter } from '@/components/scroll-animations';

function InstagramIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function HomePage() {
  const courses = getCourses();
  const resources = getResources();
  return (
    <main className="flex flex-1 flex-col">
      <Hero courses={courses} resourcesCount={resources.length} />
      <div className="rule-gold mx-auto w-full max-w-6xl" />
      <AboutSection />
      <div className="rule-gold mx-auto w-full max-w-6xl" />
      <MeetTheTeamSection />
    </main>
  );
}

/* -------------------------------------------------------------------------- */

function Hero({ courses, resourcesCount }: { courses: Course[]; resourcesCount: number }) {
  return (
    <section className="relative overflow-hidden">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-16 pt-8 text-center sm:pt-12">

        <h1 className="font-display text-[60px] font-semibold leading-[1.1] tracking-tight text-fd-foreground sm:text-[60px]">
          Digilab
          <span className="text-fd-primary"> Archive</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg text-fd-muted-foreground">
          Step-by-step guides, standard operating procedures, and environment setup notes.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-transform hover:-translate-y-px"
          >
            All Courses
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        <FadeInSection direction="bottom" delay={0} className="w-full" requireScroll={true}>
          <dl className="mt-14 grid w-full grid-cols-3 gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border">
            <StatShuffleCounter
              targetValue={courses.length}
              label="Laboratory Courses"
              delay={0}
            />
            <StatShuffleCounter
              targetValue={courses.reduce((sum, course) => sum + course.modules, 0)}
              label="Total Modules"
              delay={0}
            />
            <StatShuffleCounter
              targetValue={resourcesCount}
              label="Laboratory Resources"
              delay={0}
            />
          </dl>
        </FadeInSection>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function AboutSection() {
  return (
    <section id="about" className="mx-auto w-full max-w-6xl px-6 sm:px-10 py-20">
      <div className="grid items-center gap-10 lg:grid-cols-12">
        {/* Left Column - Logo Image (Fade in left to right) */}
        <div className="flex justify-center lg:col-span-5">
          <FadeInSection direction="left" delay={0} className="w-full max-w-sm flex justify-center">
            <div className="relative flex aspect-square w-full items-center justify-center rounded-2xl border border-fd-border bg-gradient-to-b from-fd-card to-fd-background p-8 shadow-[var(--shadow-elegant)] transition-all hover:border-fd-primary/50 group">
              <div className="absolute inset-0 rounded-2xl bg-fd-primary/5 blur-xl group-hover:bg-fd-primary/10 transition-colors" aria-hidden />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about-lab-logo.png"
                alt="Digital Laboratory DTE FTUI"
                className="relative size-52 sm:size-60 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </FadeInSection>
        </div>

        {/* Right Column - Title & Text Description (Fade in left to right with delay) */}
        <div className="space-y-5 lg:col-span-7 pr-2 sm:pr-6">
          <FadeInSection direction="left" delay={150}>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-fd-foreground sm:text-4xl pb-2">
              About the Digital Lab
            </h2>

            <p className="text-base sm:text-lg leading-relaxed text-fd-muted-foreground text-justify mb-4">
              The <strong className="font-semibold text-fd-foreground">Digital Laboratory at DTE FTUI</strong> is a specialized facility dedicated to the practical study of digital systems and computer architecture. We provide hands-on learning experiences that help students bridge the gap between theoretical concepts and real-world hardware design.
            </p>

            <p className="text-base sm:text-lg leading-relaxed text-fd-muted-foreground text-justify">
              Through comprehensive modules covering digital logic, VHDL, and assembly language, students master the fundamentals of modern embedded systems. Supported by a team of dedicated assistants, our mission is to cultivate innovative engineers equipped to tackle complex technological challenges.
            </p>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const teamPhotoMaskStyle: React.CSSProperties = {
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
};

function MeetTheTeamSection() {
  return (
    <section id="team" className="mx-auto w-full max-w-6xl px-6 sm:px-10 py-8 sm:py-10">
      <FadeInSection direction="bottom" delay={0}>
        <header className="mb-6 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-fd-foreground sm:text-4xl">
            Meet the Team
          </h2>
        </header>
      </FadeInSection>

      {/* Top Row: Daus (Col 1), Welcome Text (Col 2 & 3 merged), DS (Col 4) */}
      <FadeInSection direction="bottom" delay={150}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 items-stretch max-w-6xl mx-auto">
          {/* Slot 1: Head of Digital Laboratory (Pak Firdaus) */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/team-head-lab.png"
                alt="Muhammad Firdaus Syawaludin Lubis, S.T., M.T., Ph.D., CertDA"
                className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                style={teamPhotoMaskStyle}
              />
            </div>
          </div>

          {/* Slots 2 & 3: Text Card taking exactly 2 photo slots */}
          <div className="col-span-2 flex flex-col justify-center rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#141824] to-[#0c0f17] p-4 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
            <div className="space-y-3 text-xs sm:text-xs md:text-sm leading-relaxed text-slate-300 italic text-justify">
              <p>
                <span className="text-cyan-400 font-semibold not-italic">This laboratory</span> serves as a space for you to bridge academic theory with <span className="text-cyan-400 font-semibold not-italic">real-world technological applications</span>. We encourage all students to go beyond simply fulfilling curriculum requirements, and instead, boldly explore digital technologies to create <span className="text-cyan-400 font-semibold not-italic">creative and impactful solutions for the future</span>.
              </p>
              <p>
                We invite you to treat the Digital Lab as a hub for collaboration and experimentation, <span className="text-cyan-400 font-semibold not-italic">where you can learn without the fear of failure</span>. Use every step of your learning process here to sharpen your resilience and <span className="text-cyan-400 font-semibold not-italic">logical thinking as future engineers</span>. Welcome aboard, and let&apos;s build a dynamic culture of innovation together with the Digital Lab family.
              </p>
            </div>
          </div>

          {/* Slot 4: Lab Coordinator (Daffa Sayra Firdaus - DS) */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/team-lab-coordinator.png"
                alt="Daffa Sayra Firdaus - Lab Coordinator"
                className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                style={teamPhotoMaskStyle}
              />
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Sub-grid for Laboratory Assistants (BH, CH, JD, MF / AX, RE Centered) */}
      <div className="mt-5 pt-4 border-t border-fd-border/40 max-w-6xl mx-auto space-y-5">
        {/* Row 1: BH, CH, JD, MF (4 Columns) */}
        <FadeInSection direction="bottom">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 items-start">
            {/* Row 1 - Col 1: BH (Bryan Herdianto) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-bh.jpg"
                  alt="Bryan Herdianto"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* Row 1 - Col 2: CH (Christian Hadiwijaya) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-ch.jpg"
                  alt="Christian Hadiwijaya"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* Row 1 - Col 3: JD (Jesaya David G.N.P) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-jd.jpg"
                  alt="Jesaya David G.N.P"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* Row 1 - Col 4: MF (Muhammad Nadzhif Fikri) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-mf.jpg"
                  alt="Muhammad Nadzhif Fikri"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Row 2: AX and RE Centered Symmetrically */}
        <FadeInSection direction="bottom">
          <div className="flex flex-wrap justify-center gap-5 max-w-6xl mx-auto">
            {/* AX (Alexander Christhian) */}
            <div className="flex flex-col items-center justify-center w-[calc(50%-10px)] sm:w-[calc(25%-15px)]">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-ax.jpg"
                  alt="Alexander Christhian"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* RE (Muhammad Riyan Satrio) */}
            <div className="flex flex-col items-center justify-center w-[calc(50%-10px)] sm:w-[calc(25%-15px)]">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-re.jpg"
                  alt="Muhammad Riyan Satrio"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Grid for Comp Eng '24 Assistants (KH, NA, DY, NZ / KZ, JR, VN, QS) */}
      <div className="mt-5 pt-4 border-t border-fd-border/40 max-w-6xl mx-auto space-y-5">
        {/* Row 1: KH, NA, DY, NZ */}
        <FadeInSection direction="bottom">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 items-start">
            {/* KH (Carlsson Khovis) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-kh.jpg"
                  alt="Carlsson Khovis"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* NA (Novan Agung Wicaksono) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-na.jpg"
                  alt="Novan Agung Wicaksono"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* DY (Muhammad Dhiya 'ulhaq) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-dy.jpg"
                  alt="Muhammad Dhiya 'ulhaq"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* NZ (Nabil Putra Nurfariz) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-nz.jpg"
                  alt="Nabil Putra Nurfariz"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Row 2: KZ, JR, VN, QS */}
        <FadeInSection direction="bottom">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 items-start">
            {/* KZ (Khalisa Zahra Maulana) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-kz.jpg"
                  alt="Khalisa Zahra Maulana"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* JR (Raja Avicenna A. V.) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-jr.jpg"
                  alt="Raja Avicenna A. V."
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* VN (Vincenzo Fabian Tisila) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-vn.jpg"
                  alt="Vincenzo Fabian Tisila"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* QS (Qais Ismail) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-qs.jpg"
                  alt="Qais Ismail"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Grid for Comp Eng '25 Assistants (NH, RS, SH, SI / BD, KV Centered) */}
      <div className="mt-5 pt-4 border-t border-fd-border/40 max-w-6xl mx-auto space-y-5">
        {/* Row 1: NH, RS, SH, SI (4 Columns) */}
        <FadeInSection direction="bottom">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 items-start">
            {/* NH (Nicholas Michael Halim) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-nh.jpg"
                  alt="Nicholas Michael Halim"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* RS (Raisa Siti Hapsari) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-rs.jpg"
                  alt="Raisa Siti Hapsari"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* SH (Shannisa Al Khalisha) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-sh.jpg"
                  alt="Shannisa Al Khalisha"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* SI (Said Abdullah Samy) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-si.jpg"
                  alt="Said Abdullah Samy"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Row 2: BD and KV Centered Symmetrically */}
        <FadeInSection direction="bottom">
          <div className="flex flex-wrap justify-center gap-5 max-w-6xl mx-auto">
            {/* BD (Abdiel Deandra El Dzaky) */}
            <div className="flex flex-col items-center justify-center w-[calc(50%-10px)] sm:w-[calc(25%-15px)]">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-bd.jpg"
                  alt="Abdiel Deandra El Dzaky"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>

            {/* KV (Kenneth Vittorio Karyadi) */}
            <div className="flex flex-col items-center justify-center w-[calc(50%-10px)] sm:w-[calc(25%-15px)]">
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team-kv.jpg"
                  alt="Kenneth Vittorio Karyadi"
                  className="w-full h-auto rounded-2xl object-contain drop-shadow-xl"
                  style={teamPhotoMaskStyle}
                />
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
