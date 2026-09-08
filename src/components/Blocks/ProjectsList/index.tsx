import React from 'react';
import { sanityFetch } from '@/sanity/lib/live';
import { fetchAllProjects } from '@/sanity/lib/queries';

import type { FetchHomeResult } from '../../../../sanity.types';
import ProjectsGrid from './ProjectsGrid';

type ProjectsListBlock = NonNullable<
  NonNullable<FetchHomeResult>['blockList']
>[number] & { _type: 'projectsList' };

type IProjectsList = {
  showFeaturedProjectCard?: boolean;
  featuredProjectCardOverride?: ProjectsListBlock['featuredProjectCardOverride'];
};

const ProjectsList = async ({
  showFeaturedProjectCard,
  featuredProjectCardOverride,
}: IProjectsList) => {
  const { data: projects } = await sanityFetch({ query: fetchAllProjects });

  // Sort projects by creation date
  const sortedProjects = projects.sort((a, b) => {
    const dateA = new Date(a._createdAt || '').getTime();
    const dateB = new Date(b._createdAt || '').getTime();
    return dateB - dateA;
  });

  // Use override if provided, otherwise use the first project
  const featuredProject = showFeaturedProjectCard
    ? featuredProjectCardOverride || sortedProjects[0] || null
    : null;

  // Filter out featured project from regular items
  const regularProjects = featuredProject
    ? sortedProjects.filter((project) => project._id !== featuredProject._id)
    : sortedProjects;

  return (
    <ProjectsGrid
      featuredProject={featuredProject}
      regularProjects={regularProjects}
    />
  );
};

export default ProjectsList;
