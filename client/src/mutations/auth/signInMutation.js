import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import formatErrors from 'utils/errorsUtils';
import withFlashMessage from 'components/flash/withFlashMessage';
import { fetchCurrentUser } from 'queries/users/currentUserQuery';

export default function(WrappedComponent) {
  const fatalMessage = "Oops, we're sorry, but something went wrong";

  function onResult(response) {
    const errors = response.errors || formatErrors(response.data.signIn.errors);
    if (errors) {
      window.localStorage.removeItem('blog:token');
      this.error(errors.base || fatalMessage);
      return errors;
    }

    const token = response.data.signIn.token;
    if (token) window.localStorage.setItem('blog:token', response.data.signIn.token);
    fetchCurrentUser().then(() => {
      this.redirect('/', { notice: 'Signed in successfully.' });
    });
    return null;
  }

  const withSignIn = graphql(
    gql`
      mutation signIn($email: String, $password: String) {
        signIn(input: { email: $email, password: $password }) {
          token
          errors {
            message
            attribute
          }
        }
      }
    `,
    {
      props: ({ ownProps, mutate }) => ({
        signIn(user) {
          return mutate({
            variables: { ...user }
          })
            .then(onResult.bind(ownProps))
            .catch(error => {
              ownProps.error(fatalMessage);
            });
        }
      })
    }
  );

  return withFlashMessage(withSignIn(WrappedComponent));
}
