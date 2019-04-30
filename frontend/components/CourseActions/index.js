import { orFalse } from '~/services/orFalse';
import { commonFetch } from '~/api/commonFetch';
import { url } from '~/services/url';

import { Link } from 'react-router-dom';
import { MetaTags } from './components/MetaTags';
import { Loading } from '~/components/Loading';
import Breadcrumbs from './components/Breadcrumbs';
import CourseModal from './components/CourseModal';
import { LearnAndReviewButtons } from './components/LearnAndReviewButtons';
import { CuilActivityButtons } from './components/CuilActivityButtons';
import { CourseDescriptionAndStats } from './components/CourseDescriptionAndStats';

import css from './index.css';

@connect(
  (state, ownProps) => ({
    currentUser: state.global.Authentication.currentUser || false,
    speGetCourse: state.components.CourseActions.speGetCourse,
    // speGetCourse: { status: 'request' },
    speCourseUserIsLearning: state.components.CourseActions.speCourseUserIsLearning,
    amountOfProblems:
      (
        state.global.IdsOfProblemsToLearnAndReviewPerCourse &&
        state.global.IdsOfProblemsToLearnAndReviewPerCourse[ownProps.courseId]
      ) ?
        {
          toLearn: state.global.IdsOfProblemsToLearnAndReviewPerCourse[ownProps.courseId].toLearn.length,
          toReview: state.global.IdsOfProblemsToLearnAndReviewPerCourse[ownProps.courseId].toReview.length
        } :
        false
  }),
  (dispatch) => ({
    seedSpeGetCourse: (spe) => dispatch({
      type: 'SEED_SPE_GET_COURSE',
      payload: spe
    })
  })
)
class CourseActions extends React.Component {
  static propTypes = {
    courseId: PropTypes.string.isRequired,
    currentUser: orFalse(PropTypes.object).isRequired,
    amountOfProblems: orFalse(PropTypes.object).isRequired,

    speGetCourse: PropTypes.object.isRequired,
    speCourseUserIsLearning: PropTypes.object.isRequired,

    seedSpeGetCourse: PropTypes.func.isRequired,

    ifCuilActivityButtonsAreDisplayed: PropTypes.bool,
    ifCourseDescriptionIsDisplayed: PropTypes.bool,
    ifEditCourseModalTogglerIsDisplayed: PropTypes.bool,
    ifBreadcrumbsAreDisplayed: PropTypes.bool,
    ifConfused: PropTypes.bool
  }

  static defaultProps = {
    currentUser: false,
    ifCuilActivityButtonsAreDisplayed: true,
    ifCourseDescriptionIsDisplayed: false,
    ifEditCourseModalTogglerIsDisplayed: false,
    ifBreadcrumbsAreDisplayed: false,
    ifConfused: false
  }

  componentDidMount = () =>
    commonFetch(
      (spe) => this.props.seedSpeGetCourse(spe),
      'GET', `/api/pages/courseActions/${this.props.courseId}`
    )

  uiUpdateCourse = (course) => {
    const spe = this.props.speGetCourse;
    this.props.seedSpeGetCourse({ ...spe, payload: { ...spe.payload, course } });
  }

  renderRequestIcon = () => (
    this.props.ifCourseDescriptionIsDisplayed ?
      <div className="container">
        <div style={{ height: 130, background: 'rgb(20, 22, 45)', marginTop: 30 }}/>
      </div> :
      null
  )

  renderTitleAndButtons = (courseDto) =>
    <section className="title-and-buttons">
      <div className="container">
        <section className="course-title_and_category_and_author">
          <h3 className="title">
            <Link to={url.courseEditOrShow(this.props.currentUser, courseDto.course)}>
              {courseDto.course.title}
            </Link>
          </h3>

          {
            this.props.ifBreadcrumbsAreDisplayed &&
            <section className="category_and_author">
              <Breadcrumbs courseCategoryId={courseDto.course.courseCategoryId}/>

              <div className="author">
                By <span>Lakesare</span>
              </div>
            </section>
          }

          {
            this.props.ifEditCourseModalTogglerIsDisplayed &&
            this.props.currentUser &&
            <CourseModal
              toggler={
                <button className="button edit-button" type="button">
                  <i className="fa fa-hand-pointer-o"/> EDIT
                </button>
              }
              course={courseDto.course}
              uiUpdateCourse={this.uiUpdateCourse}
            />
          }
        </section>

        {
          this.props.currentUser ?
            <div className="buttons">
              {
                this.props.ifCuilActivityButtonsAreDisplayed &&
                <CuilActivityButtons speCourseUserIsLearning={this.props.speCourseUserIsLearning} courseId={courseDto.course.id}/>
              }

              <LearnAndReviewButtons
                courseUserIsLearning={this.props.speCourseUserIsLearning.payload}
                amountOfProblems={this.props.amountOfProblems}

                stats={courseDto.stats}
                nextDueDateIn={courseDto.nextDueDateIn}
              />
            </div> :
            <div className="please-sign-in_and_simulated-review-button">
              <h4 className="please-sign-in">Sign in to start recording results</h4>

              <Link
                to={`/courses/${this.props.courseId}/review/simulated`}
                className="simulated-review-button"
              >REVIEW ({courseDto.amountOfProblems})</Link>
            </div>
        }
      </div>
    </section>

  render = () =>
    <Loading spe={this.props.speGetCourse} requestIcon={this.renderRequestIcon()}>{(courseDto) =>
      <section className={css.actions}>
        {
          false &&
          this.props.ifConfused &&
          <article className="contact-us">
            Confused? Missing any features? <Link to="/contact">Contact us</Link>.
          </article>
        }

        {this.renderTitleAndButtons(courseDto)}

        {
          this.props.ifCourseDescriptionIsDisplayed &&
          <CourseDescriptionAndStats
            currentUser={this.props.currentUser}
            course={courseDto.course}
            stats={courseDto.stats}
            nextDueDateIn={courseDto.nextDueDateIn}
            amountOfProblemsToReview={courseDto.amountOfProblemsToReview}
            courseUserIsLearning={courseDto.courseUserIsLearning}
          />
        }

        <MetaTags title={courseDto.course.title} description={courseDto.course.description}/>
      </section>
    }</Loading>
}

export { CourseActions };
