import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Blog.module.css';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/blog/${id}`);
        setBlog(response.data);
      } catch (err) {
        console.error('Fehler beim Abrufen des Blog-Artikels:', err);
        setError('Fehler beim Abrufen des Blog-Artikels');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  if (loading) return <p>Lädt Blog...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.blogDetail}>
      <h1>{blog.title}</h1>
      <p>{blog.author}</p>
      <p>{new Date(blog.created_at).toLocaleDateString()}</p>
      {blog.coverImage && (
        <img
          src={blog.coverImage}
          alt={blog.title}
          className={styles.coverImage}
        />
      )}
      <div className={styles.content}>{blog.content}</div>
    </div>
  );
};

export default BlogDetail;

