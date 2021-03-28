import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiUser, FiCalendar } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { useEffect, useState } from 'react';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { formatDate } from '../utils/date-format';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const formatPostsPagination = (postsResponse: ApiSearchResponse) => {
  const { next_page, results } = postsResponse;

  const newResults = results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: post.data,
  }));

  return {
    results: newResults,
    next_page,
  };
};

export default function Home({
  postsPagination: { results, next_page } = {} as PostPagination,
}: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState<string>();

  useEffect(() => {
    setPosts(results);
    setNextPage(next_page);
  }, [results, next_page]);

  const handleShowMorePostButton = async () => {
    try {
      const response = await fetch(
        `${nextPage}&access_token=${process.env.PRISMIC_ACCESS_TOKEN}`
      );
      const data = await response.json();
      const {
        results: newPosts,
        next_page: newNextPage,
      } = formatPostsPagination(data);
      setPosts([...posts, ...newPosts]);
      setNextPage(newNextPage);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Head>
        <title>Posts</title>
      </Head>
      <div className={styles.container}>
        <img src="/Logo.svg" alt="logo" />
        <main className={styles.posts}>
          {posts?.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <div className={styles.post}>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.info}>
                    <div className={styles.dateInfo}>
                      <FiCalendar color="#bbbbbb" />
                      <time>{formatDate(post.first_publication_date)}</time>
                    </div>
                    <div className={styles.userInfo}>
                      <FiUser color="#bbbbbb" />
                      <span>{post.data.author}</span>
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </main>
        {nextPage && (
          <button type="button" onClick={handleGetMorePosts}>
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: formatPostsPagination(postsResponse),
    },
  };
};
