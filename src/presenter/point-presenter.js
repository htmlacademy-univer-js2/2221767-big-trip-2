import { render, replace, remove } from '../framework/render.js';
import PointEdit from '../view/point-edit';
import PointRoute from '../view/point-route';
import { isEscKeyDown } from '../utils';
import { UpdateType, UserAction } from '../mock/consts.js';

const Mode = {
  DEFAULT: 'DEFAULT',
  EDITING: 'EDITING'
};

export default class PointPresenter {

  #point = null;
  #mode = Mode.DEFAULT;

  #pointsList = null;
  #handleDataChange = null;
  #changeMode = null;

  #pointRouteComponent = null;
  #pointEditComponent = null;

  #pointsModel = null;
  #destinations = null;
  #offers = null;

  #isNewPoint = false;

  constructor(pointsList, pointsModel, handleDataChange, changeMode) {
    this.#pointsList = pointsList;
    this.#pointsModel = pointsModel;
    this.#handleDataChange = handleDataChange;
    this.#changeMode = changeMode;
  }

  init = (point) => {
    this.#point = point;
    this.#destinations = [...this.#pointsModel.destinations];
    this.#offers = [...this.#pointsModel.offers];

    const prevPointRouteComponent = this.#pointRouteComponent;
    const prevPointEditComponent = this.#pointEditComponent;

    this.#pointRouteComponent = new PointRoute(point, this.#destinations, this.#offers);
    this.#pointEditComponent = new PointEdit({
      point: point,
      destination: this.#destinations,
      offers: this.#offers,
      isNewPoint: this.#isNewPoint
    });

    this.#pointRouteComponent.setEditClickHandler(this.#handleEditClick);
    this.#pointRouteComponent.setFavoriteClickHandler(this.#handleFavoriteClick);

    this.#pointEditComponent.setFormSubmitHandler(this.#handleFormSubmit);
    this.#pointEditComponent.setCloseClickHandler(this.#handleCloseClick);
    this.#pointEditComponent.setDeleteClickHandler(this.#handleDeleteClick);

    if (prevPointRouteComponent === null || prevPointEditComponent === null) {
      render(this.#pointRouteComponent, this.#pointsList);
      return;
    }

    if (this.#mode === Mode.DEFAULT) {
      replace(this.#pointRouteComponent, prevPointRouteComponent);
    }

    if (this.#mode === Mode.EDITING) {
      replace(this.#pointEditComponent, prevPointEditComponent);
    }

    remove(prevPointRouteComponent);
    remove(prevPointEditComponent);
  };

  destroy = () => {
    remove(this.#pointRouteComponent);
    remove(this.#pointEditComponent);
  };

  resetView = () => {
    if (this.#mode !== Mode.DEFAULT) {
      this.#pointEditComponent.reset(this.#point);
      this.#replaceFormToPoint();
    }
  };

  #replacePointToForm = () => {
    replace(this.#pointEditComponent, this.#pointRouteComponent);
    this.#changeMode();
    this.#mode = Mode.EDITING;
    document.addEventListener('keydown', this.#onEscKeyDown);
  };

  #replaceFormToPoint = () => {
    replace(this.#pointRouteComponent, this.#pointEditComponent);
    this.#mode = Mode.DEFAULT;
    document.removeEventListener('keydown', this.#onEscKeyDown);
  };

  #onEscKeyDown = (evt) => {
    if (isEscKeyDown(evt)) {
      evt.preventDefault();
      this.resetView();
    }
  };

  #handleEditClick = () => {
    this.#replacePointToForm();
  };

  #handleFormSubmit = (update) => {
    this.#handleDataChange(UserAction.UPDATE_POINT, UpdateType.MINOR, update);
    this.#replaceFormToPoint();
  };

  #handleCloseClick = () => {
    this.resetView();
  };

  #handleFavoriteClick = () => {
    this.#handleDataChange(UserAction.UPDATE_POINT, UpdateType.PATCH, {
      ...this.#point,
      isFavorite: !this.#point.isFavorite});
  }

  #handleDeleteClick = (point) => {
    this.#handleDataChange(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      point,
    );
  };
}
