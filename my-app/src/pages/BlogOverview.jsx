import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Blog.module.css'; // CSS-Modul

const BlogOverview = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get('http://localhost:5001/blog');
        setBlogs(response.data);
      } catch (err) {
        console.error('Fehler beim Abrufen der Blogs:', err);
        setError('Fehler beim Abrufen der Blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) return <p>Lädt Blogs...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.blogContainer}>
      <h1>Blog</h1>
      <div className={styles.blogList}>
        {blogs.map((blog) => (
          <div key={blog._id} className={styles.blogCard}>
            {blog.coverImage && (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className={styles.coverImage}
              />
            )}
            <h2>{blog.title}</h2>
            <p>{blog.author}</p>
            <p>{new Date(blog.created_at).toLocaleDateString()}</p>
            <Link to={`/blog/${blog._id}`} className={styles.readMore}>
              Weiter lesen
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogOverview;

