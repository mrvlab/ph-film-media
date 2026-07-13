import { defineQuery } from 'next-sanity';

export const fetchAllPageSlugs = defineQuery(`
  *[_type == "page" && defined(slug.current)]{
    "slug": slug.current,
    _updatedAt
  }
`);

export const settingsQuery = defineQuery(`
    *[_type == "settings"][0]{
      _id,
      _type,
      seo {
        metaTitle,
        metaDescription,
        metaImage {
          _type,
          media {
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        }
      },
      distributionMovieDetailTitles {
        descriptionLabel,
        directorsLabel,
        writersLabel,
        actorsLabel,
        languagesLabel,
        releaseDateLabel,
        durationLabel
      }
    }
    `);

export const fetchHeader = defineQuery(`
 *[_type == "header"][0]{
  mobileLogo{
    _type,
    media{
      _type,
      alt,
      crop,
      hotspot,
      asset->{ ... }
    }
  },
  desktopLogo{
    _type,
    media{
      _type,
      alt,
      crop,
      hotspot,
      asset->{ ... }
    }
  },
  linkReference[]{
    _key,
    label,
    link{
      linkType,
      externalLink,
      internalLink->{
        _id,
        pageTitle,
        slug
      }
    }
  },
  homeMenuItemLabel,
  socialMediaLinks[]{
    _key,
    linkType,
    externalLink,
    internalLink->{
      _id,
      pageTitle,
      slug
    }
  }
}
`);

export const fetchFooter = defineQuery(`
  *[_type == "footer"][0]{
    _id,
    _type,
    title,
    email,
    text[],
    socialMediaLinks[]{
      _key,
      linkType,
      externalLink,
      internalLink->{
        _id,
        pageTitle,
        slug
      }
    },
    rights
  }
`);

export const fetchHome = defineQuery(`
*[_type == "page" && slug.current == '/'][0]{
  _id,
    _type,
    pageTitle,
    slug,
    blockList[]{
      // Page Title Block
      _type == "pageTitle" => {
        _key,
        _type,
        titleType,
        title,
        pageTitleImage{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        },
        visibility {
          hideOnMobile,
          hideOnDesktop
        }
      },
      // Hero Block
      _type == "heroCarousel" => {
        _key,
        _type,
        mediaCard[]{
          _key,
          id,
          cardImage{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          },
          title,
          infoItems[]{
            id,
            infoItemTitle
          },
          cardLink{
            linkType,
            externalLink,
            internalLink->{
              _id,
              pageTitle,
              slug
            }
          }
        },
      },
    // Media Carousel Block
    _type == "mediaCarousel" => {
      _key,
      _type,
      carouselItems[]{
        _key,
        title,
        mediaItem{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        },
      }
    },
      // Movie Club List Block
      _type == "movieClubList" => {
          _key,
          _type,
          movies[]->{
            _id,
            title,
            movieBanner{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          }
        }
      },
      // Ticket List Block
      _type == "ticketList" => {
        _key,
        _type,
        screens[]->{
          _id,
          title,
          screenImage{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          },
          link{
            linkType,
            externalLink,
            internalLink->{
              _id,
              pageTitle,
              slug
            }
          }
        }
      },
      // Tickets List Block
      _type == "ticketsList" => {
        _key,
        _type,
        heading,
        tickets[]->{
          _id,
          title,
          slug,
          date,
          price,
          currency,
          totalSeats,
          seatsSold,
          venue,
          poster{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          },
          banner{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          }
        }
      },
      // Movie Hero Block
      _type == "moviesHeroCarousel" => {
        _type,
        mediaItems{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,  
            asset->{ ... }
          }
        }
      },
      // Image With Text Block
      _type == "imageWithText" => {
        _key,
        _type,
        mediaItem{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        },
        mediaTitle,
        textSection[]{
          id,
          title,
          richText
        }
      },
      // Logo Carousel Block
      _type == "logoCarousel" => {
        _key,
        _type,
        logoItems[]{
          id,
          mediaItem{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          }
        }
      },
            // Distribution List Block
            _type == "distributionList" => {
        _key,
        _type,
        movies[]->{
        _id,
        title,
        slug{
          _type,
          current
        },
        releaseDate,
        description,
        duration,
        languages[]->{
          _id,
          language
        },
        directors[]->{
          _id,
          director
        },
        writers[]->{
          _id,
          writer
        },
        actors[]->{
          _id,
          actor
        },
        ticket,
        button,
        trailer,
        moviePoster{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        },
        movieBanner{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        }
      }
      },
      // Projects List Block
      _type == "projectsList" => {
        _key,
        _type,
        showFeaturedProjectCard,
        featuredProjectCardOverride->{
          _id,
          _type,
          _createdAt,
          _updatedAt,
          _rev,
          title,
          description,
          projectImage {
            _type,
            media {
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          },
          link{
            linkType,
            externalLink,
            internalLink->{
              _id,
              pageTitle,
              slug
            }
          }
        }
      }
    },
    seo {
      metaTitle,
      metaDescription,
      metaImage {
        _type,
        media {
          _type,
          alt,
          crop,
          hotspot,
          asset->{ ... }
        }
      }
    }
  }
`);

export const fetchPage = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    _id,
    _type,
    pageTitle,
    slug,
    blockList[]{
      // Page Title Block
      _type == "pageTitle" => {
        _key,
        _type,
        titleType,
        title,
        pageTitleImage{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        },
        visibility {
          hideOnMobile,
          hideOnDesktop
        }
      },
      // Hero Block
      _type == "heroCarousel" => {
        _key,
        _type,
        mediaCard[]{
          _key,
          id,
          cardImage{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          },
          title,
          infoItems[]{
            id,
            infoItemTitle
          },
          cardLink{
            linkType,
            externalLink,
            internalLink->{
              _id,
              pageTitle,
              slug
            }
          }
        }
      },
    // Media Carousel Block
    _type == "mediaCarousel" => {
      _key,
      _type,
      carouselItems[]{
        _key,
        title,
        mediaItem{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        },
      }
    },
      // Movie Club List Block
      _type == "movieClubList" => {
          _key,
          _type,
          movies[]->{
            _id,
            title,
            movieBanner{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          }
        }
      },
      // Ticket List Block
      _type == "ticketList" => {
        _key,
        _type,
        screens[]->{
          _id,
          title,
          screenImage{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          },
          link{
            linkType,
            externalLink,
            internalLink->{
              _id,
              pageTitle,
              slug
            }
          }
        }
      },
      // Tickets List Block
      _type == "ticketsList" => {
        _key,
        _type,
        heading,
        tickets[]->{
          _id,
          title,
          slug,
          date,
          price,
          currency,
          totalSeats,
          seatsSold,
          venue,
          poster{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          },
          banner{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          }
        }
      },
      // Movie Hero Block
      _type == "moviesHeroCarousel" => {
        _type,
        mediaItems{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,  
            asset->{ ... }
          }
        }
      },
      // Image With Text Block
      _type == "imageWithText" => {
        _key,
        _type,
        mediaItem{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        },
        mediaTitle,
        textSection[]{
          id,
          title,
          richText
        }
      },
      // Logo Carousel Block
      _type == "logoCarousel" => {
        _key,
        _type,
        logoItems[]{
          id,
          mediaItem{
            _type,
            media{
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          }
        }
      },
      // Distribution List Block
      _type == "distributionList" => {
        _key,
        _type,
        movies[]->{
        _id,
        title,
        slug{
          _type,
          current
        },
        releaseDate,
        description,
        duration,
        languages[]->{
          _id,
          language
        },
        directors[]->{
          _id,
          director
        },
        writers[]->{
          _id,
          writer
        },
        actors[]->{
          _id,
          actor
        },
        ticket,
        button,
        trailer,
        moviePoster{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        },
        movieBanner{
          _type,
          media{
            _type,
            alt,
            crop,
            hotspot,
            asset->{ ... }
          }
        }
      }
      },
      // Projects List Block
      _type == "projectsList" => {
        _key,
        _type,
        showFeaturedProjectCard,
        featuredProjectCardOverride->{
          _id,
          _type,
          _createdAt,
          _updatedAt,
          _rev,
          title,
          description,
          projectImage {
            _type,
            media {
              _type,
              alt,
              crop,
              hotspot,
              asset->{ ... }
            }
          },
          link{
            linkType,
            externalLink,
            internalLink->{
              _id,
              pageTitle,
              slug
            }
          }
        }
      }
    },
    seo {
      metaTitle,
      metaDescription,
      metaImage {
        _type,
        media {
          _type,
          alt,
          crop,
          hotspot,
          asset->{ ... }
        }
      }
    }
  }
  `);
export const fetchDistributionMovie = defineQuery(`
*[_type == "distributions" && slug.current == $slug][0]{
    title,
    slug,
    releaseDate,
    description,
    duration,
    languages[]->{
      _id,
      language
    },
    directors[]->{
      _id,
      director
    },
    writers[]->{
      _id,
      writer
    },
    actors[]->{
      _id,
      actor
    },
    ticket,
    button,
    trailer,
    moviePoster{
      _type,
      media{
        _type,
        alt,
        crop,
        hotspot,
        asset->{ ... }
      }
    },
    movieBanner{
      _type,
      media{
        _type,
        alt,
        crop,
        hotspot,
        asset->{ ... }
      }
    }
  }
`);

export const fetchAllDistributionMovieSlugs = defineQuery(`
  *[_type == "distributions" && defined(slug.current)]{
   "slug": slug.current,
   _updatedAt
  }
`);

export const fetchDistributionParentSlug = defineQuery(`
  *[_type == "page" && count(blockList[_type == "distributionList"]) > 0][0]{
    "slug": slug.current
  }
`);

export const fetchAllProjects = defineQuery(`
  *[_type == "projects"] | order(_createdAt desc) {
    _id,
    _type,
    _createdAt,
    _updatedAt,
    _rev,
    title,
    description,
    projectImage {
      _type,
      media {
        _type,
        alt,
        crop,
        hotspot,
        asset->{ ... }
      }
    },
    link{
      linkType,
      externalLink,
      internalLink->{
        _id,
        pageTitle,
        slug
      }
    }
  }
`);

export const fetchLatestProject = defineQuery(`
  *[_type == "projects"] | order(_createdAt desc)[0] {
    _id,
    _type,
    _createdAt,
    _updatedAt,
    _rev,
    title,
    description,
    projectImage {
      _type,
      media {
        _type,
        "alt": coalesce(alt, null),
        crop,
        hotspot,
        asset->{ ... }
      }
    }
  }
`);
