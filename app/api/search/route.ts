import { createSearchAPI, type AdvancedIndex } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';
import { getResources } from '@/lib/resources';
import { getCourses } from '@/lib/courses';

/**
 * Unified Search API
 *
 * Indexes:
 * 1. Practicum Modules (.mdx documentation pages)
 * 2. Laboratory Resources (software installers, SOPs, templates)
 * 3. Laboratory Courses
 */
export const { GET } = createSearchAPI('advanced', {
  indexes: async () => {
    const indexes: AdvancedIndex[] = [];

    // 1. Index documentation pages (Practicum Modules)
    const pages = source.getPages();
    for (const page of pages) {
      const courseName = (page.data as { course?: string }).course;
      indexes.push({
        id: page.url,
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        breadcrumbs: ['Practicum Modules', courseName || 'Docs'],
        structuredData: {
          headings: [],
          contents: [
            {
              heading: page.data.title,
              content: `${page.data.title} ${page.data.description || ''}`,
            },
          ],
        },
      });
    }

    // 2. Index Laboratory Resources (Software Installers, SOPs, Templates, etc.)
    try {
      const resources = getResources();
      for (const res of resources) {
        indexes.push({
          id: `res-${res.id}`,
          title: res.title,
          description: `${res.category} · ${res.description}`,
          url: '/resources',
          breadcrumbs: ['Laboratory Resources', res.category],
          structuredData: {
            headings: [],
            contents: [
              {
                heading: res.title,
                content: `${res.title} ${res.description} ${res.category} ${res.fileName || ''} download software installer SOP template resource`,
              },
            ],
          },
        });
      }
    } catch (e) {
      console.error('Failed to index resources for search:', e);
    }

    // 3. Index Laboratory Courses
    try {
      const courses = getCourses();
      for (const course of courses) {
        indexes.push({
          id: `course-${course.slug}`,
          title: course.title,
          description: course.description,
          url: course.href,
          breadcrumbs: ['Laboratory Courses', course.level],
          structuredData: {
            headings: [],
            contents: [
              {
                heading: course.title,
                content: `${course.title} ${course.description} ${course.level}`,
              },
            ],
          },
        });
      }
    } catch (e) {
      console.error('Failed to index courses for search:', e);
    }

    return indexes;
  },
});
