import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';

import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import { userProfile } from '../data/mockData';
import { palette } from '../theme/theme';

export default function Profile() {
  return (
    <Box sx={{ pb: 12 }}>
      <AppHeader title="Profile" />

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, maxWidth: 900, mx: 'auto' }}>
        {/* User information */}
        <Card>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 68,
                  height: 68,
                  bgcolor: palette.primary,
                  fontWeight: 800,
                  fontSize: 24,
                  boxShadow: `0 12px 26px -14px ${palette.primary}`,
                }}
              >
                {userProfile.avatarInitials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {userProfile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userProfile.email}
                </Typography>
                <Chip
                  size="small"
                  label={userProfile.level}
                  icon={<WorkspacePremiumRoundedIcon sx={{ color: '#fff !important' }} />}
                  sx={{
                    mt: 1,
                    bgcolor: palette.primary,
                    color: '#fff',
                    '& .MuiChip-icon': { color: '#fff' },
                  }}
                />
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Level progress
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                {userProfile.levelProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={userProfile.levelProgress}
              aria-label="Level progress"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Member since {userProfile.joinedSince}
            </Typography>
          </CardContent>
        </Card>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              label="Speaking sessions"
              value={`${userProfile.totalSessions}`}
              hint="All time"
              icon={<MicRoundedIcon />}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              label="Minutes spoken"
              value={`${userProfile.totalMinutes}`}
              hint="All time"
              icon={<TimerRoundedIcon />}
              accent={palette.success}
              accentSoft="#E4F7EC"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              label="Current streak"
              value={`${userProfile.currentStreak}d`}
              hint={`Best ${userProfile.longestStreak} days`}
              icon={<LocalFireDepartmentRoundedIcon />}
              accent={palette.warning}
              accentSoft="#FFF3DF"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              label="Words learned"
              value={`${userProfile.wordsLearned}`}
              hint="Vocabulary bank"
              icon={<MenuBookRoundedIcon />}
              accent="#2E9BF0"
              accentSoft="#E4F2FE"
            />
          </Grid>
        </Grid>

        {/* Learning progress */}
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Learning progress
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Your skill scores updated after every session.
            </Typography>

            <Stack spacing={2.25} sx={{ mt: 2.5 }}>
              {userProfile.skills.map((skill) => (
                <Box key={skill.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {skill.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {skill.value}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={skill.value}
                    aria-label={`${skill.label}: ${skill.value}%`}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
