/** Role-aware newsroom navigation, shared by the desktop and mobile staff menus. */

export interface StaffLink {
  href: string;
  label: string;
}

export interface StaffGroup {
  section: string;
  links: StaffLink[];
}

export function staffNav({
  isEditor,
  isAdmin,
}: {
  isEditor: boolean;
  isAdmin: boolean;
}): StaffGroup[] {
  const groups: StaffGroup[] = [
    {
      section: 'Newsroom',
      links: [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/dashboard/stories', label: 'My stories' },
        { href: '/dashboard/stories/new', label: 'New story' },
        { href: '/dashboard/studio', label: 'Studio' },
        { href: '/dashboard/media', label: 'Media library' },
      ],
    },
  ];
  if (isEditor) {
    groups.push({
      section: 'Editorial',
      links: [
        { href: '/dashboard/copydesk', label: 'Copy desk' },
        { href: '/dashboard/review', label: 'Review queue' },
        { href: '/dashboard/moderation', label: 'Moderation' },
      ],
    });
  }
  if (isAdmin) {
    groups.push({
      section: 'Administration',
      links: [
        { href: '/dashboard/monitor', label: 'Monitor' },
        { href: '/dashboard/articles', label: 'All articles' },
        { href: '/dashboard/users', label: 'Users & roles' },
        { href: '/dashboard/settings', label: 'Settings' },
      ],
    });
  }
  return groups;
}
