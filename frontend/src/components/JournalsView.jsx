import React from "react";
import NewspaperReview from "./NewspaperReview";
import "../styles/JounalView.css";

function JournalsView() {
  return (
    <div>
      <div className="newspaper-layout">
        <NewspaperReview />
        <div className="newspaper-container">
          <h1 className="newspaper-h1">AEGC Journaux</h1>
          <div className="images-grid">
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt="Journal 1"
              />
              <div>
                <h3>
                    <a href="/review">AEGC Review</a>
                </h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Explicabo reprehenderit necessitatibus repudiandae magnam
                  unde. Provident?
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt="Journal 1"
              />
              <div>
                <h3>
                    <a href="">AEGC Papers and Processig</a>
                </h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Explicabo reprehenderit necessitatibus repudiandae magnam
                  unde. Provident?
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt="Journal 1"
              />
              <div>
                <h3>
                    <a href="">AEGC Economic Review</a>
                </h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Explicabo reprehenderit necessitatibus repudiandae magnam
                  unde. Provident?
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt="Journal 1"
              />
              <div>
                <h3>
                    <a href="">Management Review</a>
                </h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Explicabo reprehenderit necessitatibus repudiandae magnam
                  unde. Provident?
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt="Journal 1"
              />
              <div>
                <h3>
                    <a href="">Reserch</a>
                </h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Explicabo reprehenderit necessitatibus repudiandae magnam
                  unde. Provident?
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt="Journal 1"
              />
              <div>
                <h3>
                    <a href="">AEGC Metadata</a>
                </h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Explicabo reprehenderit necessitatibus repudiandae magnam
                  unde. Provident?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JournalsView
