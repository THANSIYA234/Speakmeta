import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from 'react-router-dom';

import Logo from './Logo';
import DesktopNav from './DesktopNav';
import { palette } from '../theme/theme';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showAvatar?: boolean;
  onBack?: () => void;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  showAvatar = false,
  onBack,
}: AppHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  const showWordmark = !title;

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, gap: 1.5 }}>
        {showBack && (
          <IconButton
            onClick={handleBack}
            aria-label="Go back"
            sx={{
              ml: -1,
              display: { xs: 'inline-flex', md: 'none' },
              bgcolor: palette.primaryLight,
              color: palette.primaryDark,
              '&:hover': { bgcolor: palette.secondarySoft },
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        )}

        <Box sx={{ flexGrow: 1, minWidth: 0, display: { xs: 'block', md: 'none' } }}>
          {title ? (
            <>
              <Typography variant="h6" noWrap sx={{ fontWeight: 800 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {subtitle}
                </Typography>
              )}
            </>
          ) : (
            <Logo size={38} showWordmark={showWordmark} />
          )}
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
          <Logo size={38} />
          <DesktopNav />
        </Box>

        {showAvatar && (
          <Avatar
            sx={{
              bgcolor: palette.primary,
              fontWeight: 800,
              width: 40,
              height: 40,
            }}
          >
            AR
          </Avatar>
        )}
      </Toolbar>
    </AppBar>
  );
}
