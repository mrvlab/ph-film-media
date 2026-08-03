'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import SanityProjectCard from '../ProjectsCard';
import type { FetchAllProjectsResult } from '../../../../../sanity.types';
import { useIsDesktop } from '../../../../utils/isDesktop';
import {
  useStaggeredGridReveal,
  type ColumnQuery,
} from '@/hooks/useStaggeredGridReveal';

type IProjectsGrid = {
  featuredProject: FetchAllProjectsResult[number] | null;
  regularProjects: FetchAllProjectsResult;
};

const featuredVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutCubic
    },
  },
};

const COLUMN_QUERIES: readonly ColumnQuery[] = [
  ['(min-width: 1536px)', 4],
  ['(min-width: 1024px)', 3],
  ['(min-width: 768px)', 2],
];

const ProjectsGrid = ({ featuredProject, regularProjects }: IProjectsGrid) => {
  const isDesktop = useIsDesktop();
  const { animationKey, isReady, setRef, getItemProps } = useStaggeredGridReveal(
    COLUMN_QUERIES,
    regularProjects?.length ?? 0,
  );

  if (!regularProjects || (regularProjects.length === 0 && !featuredProject)) {
    return null;
  }

  return (
    <section key={animationKey} className="page-x-spacing grid gap-2">
      {featuredProject && (
        <motion.div
          variants={featuredVariants}
          initial="hidden"
          animate={isReady ? 'visible' : 'hidden'}
          whileInView={!isReady ? undefined : 'visible'}
          viewport={{ once: true, amount: isDesktop ? 0.1 : 0 }}
          className={
            featuredProject.link ? 'hover:opacity-80 transition-opacity' : ''
          }
        >
          <SanityProjectCard
            key={featuredProject._id}
            project={featuredProject}
            isFeatured={true}
          />
        </motion.div>
      )}
      <div className="grid gap-x-2 gap-y-5 grid-cols-1 md:grid-cols-2 lg:gap-y-10 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
        {regularProjects.map((project, index) => {
          const isFirstHighlighted = !featuredProject && index === 0;
          const hasLink = !!project.link;
          const className = `flex flex-col gap-6 ${hasLink ? 'hover:opacity-80 transition-opacity' : ''} h-full ${isFirstHighlighted ? 'p-2.5 bg-dark-gray rounded-lg' : ''}`;

          return (
            <motion.div
              key={project._id}
              ref={setRef}
              data-index={index}
              {...getItemProps(index)}
            >
              <SanityProjectCard project={project} className={className} />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ProjectsGrid;
