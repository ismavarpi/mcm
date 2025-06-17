import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useAuth } from '../hooks/useAuth';

export default function Header({ appName, onAdmin, onModels, onHelp, onLogin }) {
  const { user, requiresAuth, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = event => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {appName}
        </Typography>
        <MenuItem onClick={onModels}>Modelos</MenuItem>
        <IconButton color="inherit" onClick={onHelp}>
          <HelpOutlineIcon />
        </IconButton>
        <IconButton color="inherit" onClick={onAdmin}>
          <SettingsIcon />
        </IconButton>
        {requiresAuth && (
          <>
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircleIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              {user ? (
                <MenuItem disabled>{user.username}</MenuItem>
              ) : (
                <MenuItem onClick={() => { handleClose(); onLogin(); }}>Login</MenuItem>
              )}
              {user && (
                <MenuItem onClick={() => { handleClose(); logout(); }}>Logout</MenuItem>
              )}
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
