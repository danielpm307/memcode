import CourseApi from '~/api/CourseApi';
import CourseCategoryApi from '~/api/CourseCategoryApi';

import { withRouter } from "react-router-dom";
import { Helmet } from 'react-helmet';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import Loading from '~/components/Loading';
import Pagination from '~/components/Pagination';
import ListOfCourseCards from '~/appComponents/ListOfCourseCards';
import CourseCategories from '~/appComponents/CourseCategories';
import SortBySelect from './components/SortBySelect';

import css from './index.css';

const getCategoryId = (props) => {
  const categoryId = getQuery(props).get('categoryId');
  return categoryId ? parseInt(categoryId) : false;
};

const getCurrentPage = (props) => {
  const currentPage = getQuery(props).get('page');
  return currentPage ? parseInt(currentPage) : 1;
};

const getSortBy = (props) => {
  const sortBy = getQuery(props).get('sortBy');
  return sortBy ? sortBy : 'popular';
};

const getQuery = (props) =>
  new URLSearchParams(props.location.search);

import { AuthenticationActions } from '~/reducers/Authentication';
@withRouter
@connect(
  () => ({}),
  (dispatch) => ({
    signIn: (token) => AuthenticationActions.signIn(dispatch, token)
  })
)
class Page_courses extends React.Component {
  static propTypes = {
    location: PropTypes.object.isRequired,
    signIn: PropTypes.func.isRequired
  }

  state = {
    speGetCourses: {},
    speGetCategories: {},
    // to avoid blinking pagination
    amountOfPages: 1,
    ifCoursesAreLoading: false
  }

  componentDidMount = () => {
    this.apiGetCourses();
    this.apiGetCategories();
    this.tryToFindToken();
  }

  componentDidUpdate = (prevProps) => {
    if (
      getCategoryId(prevProps) !== getCategoryId(this.props) ||
      getCurrentPage(prevProps) !== getCurrentPage(this.props) ||
      getSortBy(prevProps) !== getSortBy(this.props)
    ) {
      this.apiGetCourses();
    }
  }

  tryToFindToken = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    if (token) {
      this.props.signIn(token);
      // this.props.history.push('/courses/learning');
    }
  }

  apiGetCategories = () =>
    CourseCategoryApi.selectWithGroups(
      (spe) => this.setState({ speGetCategories: spe })
    )

  apiGetCourses = () =>
    CourseApi.selectPublic(
      (spe) => {
        // if there are already some courses
        if (this.state.speGetCourses.payload) {
          if (spe.status === 'success') {
            this.setState({ speGetCourses: spe, ifCoursesAreLoading: false }, this.uiFocusOnFirstCourseCard);
          } else {
            this.setState({ ifCoursesAreLoading: true });
          }
        } else {
          this.setState({ speGetCourses: spe }, this.uiFocusOnFirstCourseCard);
        }
      },
      {
        pageSize: 16,
        pageNumber: getCurrentPage(this.props),
        sortBy: getSortBy(this.props),
        ...(getCategoryId(this.props) ?
          { courseCategoryId: getCategoryId(this.props) } :
          {}
        )
      }
    )
      .then(({ amountOfPages }) => {
        this.setState({ amountOfPages });
      })

  uiFocusOnFirstCourseCard = () => {
    const courseCard = document.querySelector('a.standard-course-card');
    if (courseCard) {
      courseCard.focus();
    }
  }

  getUrlForNewPageNumber = (pageN) => {
    const newQuery = getQuery(this.props);
    newQuery.set('page', pageN);
    return this.props.location.pathname + '?' + newQuery.toString();
  }

  getUrlForNewSortBy = (sortBy) => {
    const newQuery = getQuery(this.props);
    newQuery.set('page', 1);
    newQuery.set('sortBy', sortBy);
    return this.props.location.pathname + '?' + newQuery.toString();
  }

  getCurrentCategoryName = (courseCategories) => {
    const currentCategoryId = getCategoryId(this.props);
    if (currentCategoryId) {
      return courseCategories.find((category) => category.id === currentCategoryId).name;
    } else {
      return 'Courses';
    }
  }

  renderPagination = (className = '') =>
    <Pagination
      className={className}
      amountOfPages={this.state.amountOfPages}
      currentPage={getCurrentPage(this.props)}
      getUrlForNewPageNumber={this.getUrlForNewPageNumber}
    />

  render = () =>
    <main className={css.main}>
      <Header/>

      <Loading spe={this.state.speGetCategories}>{({ courseCategoryGroups, courseCategories }) =>
        <div className="container standard-navigation_and_courses">
          <CourseCategories
            selectedCourseCategoryId={getCategoryId(this.props)}
            courseCategoryGroups={courseCategoryGroups}
            courseCategories={courseCategories}
            ifShowAmountOfCoursesInCategory={false}
          />

          <div className="title_and_sorting_and_courses">
            <div className="title_and_sorting">
              <h1 className="title">{this.getCurrentCategoryName(courseCategories)}</h1>

              <SortBySelect
                sortBy={getSortBy(this.props)}
                getUrlForNewSortBy={this.getUrlForNewSortBy}
              />
            </div>

            {this.renderPagination()}

            <Loading className="list-of-courses-loading" spe={this.state.speGetCourses}>{({ onePageOfCourses }) =>
              <ListOfCourseCards
                className={`list-of-courses ${this.state.ifCoursesAreLoading ? '-loading' : ''}`}
                type="simple"
                courseDtos={onePageOfCourses}
              />
            }</Loading>
          </div>
        </div>
      }</Loading>

      <Footer/>

      <Helmet>
        <title>Memcode | Courses</title>
        <meta name="description" content="Learn existing courses on programming, maths and physics, or create your own."/> :
      </Helmet>
    </main>
}

export default Page_courses;
