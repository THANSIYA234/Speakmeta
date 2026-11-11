import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

export const navItems = [
  { label: 'Home', value: '/dashboard', icon: <HomeRoundedIcon /> },
  { label: 'Topics', value: '/topics', icon: <GridViewRoundedIcon /> },
  { label: 'Practice', value: '/practice', icon: <MicRoundedIcon /> },
  { label: 'Profile', value: '/profile', icon: <PersonRoundedIcon /> },
];

export const getActiveNavValue = (pathname: string) =>
  navItems.find(
    (item) => pathname === item.value || pathname.startsWith(`${item.value}/`),
  )?.value ?? '/dashboard';
