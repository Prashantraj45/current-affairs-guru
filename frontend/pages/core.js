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
  return (
    <>
      <PageHeader
        label="Core"
        title="UPSC Pillars"
        meta="Static framework for GS Paper I-IV and revision scaffolding"
      />
      <StaggerContainer className="grid gap-4 md:grid-cols-2">
        {GS_PILLARS.map((pillar) => {
          const Icon = ICONS[pillar.icon];
          return (
            <ScrollReveal key={pillar.key}>
              <article className="glass-panel rounded-panel border p-5">
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
                <ul className="space-y-2">
                  {pillar.topics.map((topic) => (
                    <li key={topic} className="text-sm text-on-surface">
                      - {topic}
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
