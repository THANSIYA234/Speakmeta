import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useLocation, useNavigate } from 'react-router-dom';

import { navItems, getActiveNavValue } from './navItems';
import { palette } from '../theme/theme';

export default function DesktopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeValue = getActiveNavValue(pathname);

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}
    >
      {navItems.map((item) => {
        const isActive = item.value === activeValue;
        return (
          <Button
            key={item.value}
            onClick={() => navigate(item.value)}
            startIcon={item.icon}
            sx={{
              color: isActive ? palette.primaryDark : palette.textMuted,
              backgroundColor: isActive ? palette.primaryLight : 'transparent',
              fontWeight: 700,
              px: 2,
              py: 1,
              '&:hover': {
                backgroundColor: isActive ? palette.primaryLight : palette.secondarySoft,
              },
              '& .MuiButton-startIcon': { color: 'inherit' },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
}
