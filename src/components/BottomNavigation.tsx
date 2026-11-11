import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useLocation, useNavigate } from 'react-router-dom';

import { getActiveNavValue, navItems } from './navItems';
import { palette } from '../theme/theme';

export default function AppBottomNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeValue = getActiveNavValue(pathname);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        display: { xs: 'block', md: 'none' },
        pointerEvents: 'none',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          pointerEvents: 'auto',
          width: '100%',
          borderTop: `1px solid ${palette.border}`,
          borderRadius: 0,
          boxShadow: 'none',
        }}
      >
        <BottomNavigation
          value={activeValue}
          onChange={(_event, value: string) => navigate(value)}
          showLabels
          sx={{
            '& .MuiBottomNavigationAction-root': {
              minWidth: 64,
              paddingBlock: '6px',
              color: palette.textMuted,
              '&.Mui-selected': { color: palette.primary },
            },
            '& .MuiBottomNavigationAction-label': {
              fontWeight: 700,
              fontSize: '0.72rem',
            },
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
