import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const amountWordsOfBody = RichText.asText(
    post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
  ).split(' ').length;

  const amountWordsOfHeading = post.data.content.reduce((acc, data) => {
    if (data.heading) {
      return [...acc, ...data.heading.split(' ')];
    }

    return [...acc];
  }, []).length;

  function dateFormated(date: string) {
    return format(parseISO(date), 'd MMM yyyy', { locale: ptBR });
  }

  const readingTime = Math.ceil(
    (amountWordsOfBody + amountWordsOfHeading) / 200
  );

  return (
    <>
      <div className={commonStyles.container}>
        <Header />
      </div>
      <div className={styles.banner}>
        {post.data?.banner?.url && (
          <img src={post.data.banner.url} alt="banner" />
        )}
      </div>
      <div className={commonStyles.container}>
        <main className={styles.postContainer}>
          <div className={styles.infoContent}>
            <h1>{post.data.title}</h1>
            <p className={styles.infoDetails}>
              <span>
                <FiCalendar size={20} color="#BBBBBB" />
                {dateFormated(post.first_publication_date)}
              </span>
              <span>
                <FiUser size={20} color="#BBBBBB" />
                {post.data.author}
              </span>
              <span>
                <FiClock size={20} color="#BBBBBB" />
                {readingTime} min
              </span>
            </p>
          </div>

          <article className={styles.boxPost}>
            {post.data.content.map(({ heading, body }) => (
              <div key={heading}>
                {heading && <h2>{heading}</h2>}

                <div
                  className={styles.postSection}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
                />
              </div>
            ))}
          </article>
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return { params: { slug: post.uid } };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const post = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post,
    },
  };
};
