import React from 'react';
import styles from '../styles/CategoriesSection.module.css';

const CollectionsSection = () => {
  const collections = [
    {
      title: 'Unsere Heimat',
      description: 'Hochwertige Heilung aus der Heimat.',
      image: '/Europa.webp',
      link: '/categories/Europa',
    },
    {
      title: 'Ayurveda',
      description: 'Luxuriöse Rituale aus der Ayurveda.',
      image: '/Ayurveda.webp',
      link: '/categories/Ayurveda',
    },
    {
      title: 'TCM',
      description: 'Entdecke alte Schätze deiner Gesundheit.',
      image: '/TCM.webp',
      link: '/categories/TCM',
    },
  ];

  return (
    <section className={styles.collectionsSection}>
      <h2>Kollektionen</h2>
      <div className={styles.collectionsGrid}>
        <div className={styles.largeCollection}>
          <img
            src={collections[0].image}
            alt={collections[0].title}
            className={styles.collectionImage}
          />
          <div className={styles.collectionContent}>
            <h3>{collections[0].title}</h3>
            <p>{collections[0].description}</p>
            <a href={collections[0].link} className={styles.collectionButton}>
              Entdecken
            </a>
          </div>
        </div>
        <div className={styles.smallCollections}>
          {collections.slice(1).map((collection, index) => (
            <div key={index} className={styles.smallCollectionCard}>
              <img
                src={collection.image}
                alt={collection.title}
                className={styles.collectionImage}
              />
              <div className={styles.collectionContent}>
                <h3>{collection.title}</h3>
                <p>{collection.description}</p>
                <a href={collection.link} className={styles.collectionButton}>
                  Entdecken
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionsSection;

