//import material UI
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import CameraIcon from '@mui/icons-material/PhotoCamera';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import { createTheme, ThemeProvider } from '@mui/material/styles';


//import utilities 
import useAppStore from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState} from 'react';

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}



// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function Profile() {


const username = useAppStore(state => state.username);
const userID = useAppStore(state => state.id);
console.log(userID)
const navigate = useNavigate();
const [posts, setPosts] = useState([]);

  // Set the username in local storage when it changes
  useEffect(() => {
    localStorage.setItem('username', username);
  }, [username]);

  // Get the username from local storage on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      useAppStore.setState({ username: storedUsername });
    }
  }, []);

  //GET fetch request to show posts specific to user
  useEffect(() => {
    // Fetch all posts
    fetch(`http://localhost:3000/api/user/${userID}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Error fetching posts');
        }
      })
      .then((data) => {
        console.log(data)
        setPosts(data.userPosts);
      })
      .catch((error) => {
        console.error('Error fetching posts:', error);
      });
  }, []);


    // DELETE handler to delete a post
    const deletePostHandler = (postId) => {
        fetch(`http://localhost:3000/api/feed/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: postId }),
        })
          .then((response) => {
            if (response.ok) {
              // Remove the deleted post from the local state
              const updatedPosts = posts.filter((post) => post.id !== postId);
              setPosts(updatedPosts);
            } else {
              throw new Error('Error deleting post');
            }
          })
          .catch((error) => {
            console.error('Error deleting post:', error);
          });
      };

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar>
          <CameraIcon sx={{ mr: 2 }} />
          <Typography variant="h6" color="inherit" noWrap>
            Travel Bug
          </Typography>
        </Toolbar>
      </AppBar>
      <main>
        {/* Hero unit */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            pt: 8,
            pb: 6,
          }}
        >
          <Container maxWidth="sm">
            <Typography
              component="h1"
              variant="h2"
              align="center"
              color="text.primary"
              gutterBottom
            >
             {username}
            </Typography>
            <Stack
              sx={{ pt: 3 }}
              direction="row"
              spacing={2}
              justifyContent="center"
            >
                
              {/* <Button variant="contained" onClick={() => navigate('/feed')}>Feed</Button> */}
            </Stack>
          </Container>
        </Box>
        <Container sx={{ py: 8 }} maxWidth="md">
          {/* End hero unit */}
          <Grid container spacing={4}>
            {posts.map((post) => (
              <Grid item key={post.id} xs={12} sm={6} md={4}>
                <Card
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      // 16:9
                      pt: '56.25%',
                    }}
                    image={post.image}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {post.title}
                    </Typography>
                    <Typography>
                    {post.content}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Edit</Button>
                    <Button size="small" onClick={() => deletePostHandler(post.id)} >Delete</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </main>
      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">

        <Copyright />
      </Box>
      {/* End footer */}
    </ThemeProvider>
  );
}