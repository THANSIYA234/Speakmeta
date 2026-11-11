import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { useNavigate } from 'react-router-dom';

import type { Topic } from '../types';

interface TopicCardProps {
  topic: Topic;
  onSelect?: (topic: Topic) => void;
}

export default function TopicCard({ topic, onSelect }: TopicCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSelect) {
      onSelect(topic);
      return;
    }
    navigate(`/practice/${topic.id}`);
  };

  return (
    <Card
      component="button"
      type="button"
      onClick={handleClick}
      sx={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        border: `1px solid ${topic.accentSoft}`,
        backgroundColor: '#fff',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 20px 36px -24px ${topic.accent}`,
          borderColor: topic.accent,
        },
        '&:focus-visible': {
          outline: `3px solid ${topic.accent}`,
          outlineOffset: 2,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '18px',
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              fontSize: 26,
              backgroundColor: topic.accentSoft,
            }}
          >
            <span aria-hidden>{topic.icon}</span>
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
              {topic.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {topic.description}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={topic.difficulty}
                sx={{
                  bgcolor: topic.accentSoft,
                  color: topic.accent,
                  height: 26,
                  fontSize: '0.72rem',
                }}
              />
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {topic.durationMinutes} min
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              alignSelf: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: topic.accentSoft,
              color: topic.accent,
              flexShrink: 0,
            }}
          >
            <ArrowForwardRoundedIcon fontSize="small" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
