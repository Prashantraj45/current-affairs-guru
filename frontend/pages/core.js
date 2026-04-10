import { useRouter } from 'next/router';
import { BarChart3, Globe2, Scale, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import StaggerContainer from '../components/animations/StaggerContainer';
import ScrollReveal from '../components/animations/ScrollReveal';
import { GS_PILLARS } from '../lib/constants';

const ICONS = {
  Globe2,
  Scale,
  BarChart3,
  ShieldCheck,
};

export default function CorePage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        label="Core"
        title="Core Atlas"
        meta="Pick a paper or sub-topic to open a dedicated results canvas"
      />
      <StaggerContainer className="grid gap-4 md:grid-cols-2">
        {GS_PILLARS.map((pillar) => {
          const Icon = ICONS[pillar.icon];
          return (
            <ScrollReveal key={pillar.key}>
              <article className="glass-panel rounded-panel border border-outline-variant p-5 transition">
                <div className="mb-3 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.17em] text-on-surface-variant">{pillar.key}</p>
                    <h3 className="font-headline text-2xl text-on-surface">{pillar.title}</h3>
                  </div>
                </div>
                <p className="mb-4 text-sm text-on-surface-variant">{pillar.description}</p>
                <button
                  type="button"
                  className="mb-3 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/20"
                  onClick={() =>
                    router.push(`/core-results?label=${encodeURIComponent(pillar.key)}&query=${encodeURIComponent(pillar.title)}`)
                  }
                >
                  Open {pillar.key} canvas
                </button>
                <ul className="space-y-2">
                  {pillar.topics.map((topic) => (
                    <li key={topic}>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/core-results?label=${encodeURIComponent(`${pillar.key}: ${topic}`)}&query=${encodeURIComponent(topic)}`
                          )
                        }
                        className="w-full rounded-md px-2 py-1 text-left text-sm text-on-surface transition hover:bg-surface-high hover:text-primary"
                      >
                        - {topic}
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>
          );
        })}
      </StaggerContainer>
    </>
  );
}
